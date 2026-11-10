import { useState } from 'react'
import { repo } from '../../data'
import { relativeDay } from '../../domain/dates'
import { dueCards, GRADE_LABELS, newCardFields, parseCardLines, reviewCard, type Grade } from '../../domain/flashcards'
import type { Assignment, Card, Course, Deck } from '../../domain/types'
import { Modal } from '../../ui/Modal'
import { showToast } from '../../ui/toast'

/** Flashcard decks with spaced repetition. A deck can be tied to an exam so reviews finish before it. */
export function CardsPanel({ decks, cards, courses, assignments, today }: { decks: Deck[]; cards: Card[]; courses: Course[]; assignments: Assignment[]; today: string }) {
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState<Deck | null>(null)
  const [studying, setStudying] = useState<Deck | null>(null)
  const exams = assignments.filter((a) => a.type === 'exam' && a.status !== 'done')
  const examOf = (d: Deck) => assignments.find((a) => a.id === d.examId)

  async function removeDeck(d: Deck) {
    const mine = cards.filter((c) => c.deckId === d.id)
    await repo.decks.remove(d.id)
    for (const c of mine) await repo.cards.remove(c.id)
    showToast(`Deleted ${d.name}.`, { actionLabel: 'Undo', onAction: () => void (async () => { await repo.decks.put(d); for (const c of mine) await repo.cards.put(c) })() })
  }

  return (
    <div>
      <div className="inline" style={{ marginBottom: 16 }}><button className="btn" type="button" onClick={() => setCreating(true)}>New deck</button></div>
      {decks.length === 0 ? (
        <div className="empty"><p>No flashcards yet.</p><p className="sub">Make a deck, link it to an exam, and add cards like “Mitochondria | powerhouse of the cell”. Studyboard brings each card back just before you would forget it, and always before the exam.</p></div>
      ) : (
        <div className="bento">
          {decks.map((d) => {
            const mine = cards.filter((c) => c.deckId === d.id)
            const due = dueCards(mine, today).length
            const exam = examOf(d)
            return (
              <section key={d.id} className="tile span-6" aria-label={d.name}>
                <header className="hobbyhead">
                  <i className="dot big" style={{ background: courses.find((c) => c.id === d.courseId)?.color ?? 'var(--muted)' }} />
                  <div><h3>{d.name}</h3><p className="sub">{mine.length} cards{exam ? ` · for ${exam.title}, ${relativeDay(exam.dueDate, today)}` : ''}</p></div>
                  <div className="streak"><div className="wide num">{due}</div><span className="mono">due</span></div>
                </header>
                <div className="actions">
                  <button className="btn" type="button" disabled={due === 0} onClick={() => setStudying(d)}>{due === 0 ? 'All caught up' : 'Study now'}</button>
                  <button className="btn ghost" type="button" onClick={() => setAdding(d)}>Add cards</button>
                  <button className="btn ghost" type="button" onClick={() => removeDeck(d)}>Delete</button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New deck">{creating && <NewDeck courses={courses} exams={exams} onClose={() => setCreating(false)} />}</Modal>
      <Modal open={adding !== null} onClose={() => setAdding(null)} title={adding ? `Add cards: ${adding.name}` : 'Add cards'}>{adding && <AddCards deck={adding} today={today} onClose={() => setAdding(null)} />}</Modal>
      <Modal open={studying !== null} onClose={() => setStudying(null)} title={studying ? studying.name : 'Study'}>{studying && <Study deck={studying} cards={cards} today={today} examDate={examOf(studying)?.dueDate} />}</Modal>
    </div>
  )
}

function NewDeck({ courses, exams, onClose }: { courses: Course[]; exams: Assignment[]; onClose: () => void }) {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [examId, setExamId] = useState('')
  async function save() {
    if (!name.trim()) return
    await repo.decks.put({ name: name.trim(), courseId: courseId || undefined, examId: examId || undefined })
    onClose()
  }
  return (
    <div className="form-grid">
      <label className="field full">Name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Unit 5 vocabulary" /></label>
      <label className="field">Course<select value={courseId} onChange={(e) => setCourseId(e.target.value)}><option value="">None</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="field">For an exam (optional)<select value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">None</option>{exams.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.dueDate}</option>)}</select></label>
      <div className="actions full"><button className="btn" type="button" onClick={save}>Create</button><button className="btn ghost" type="button" onClick={onClose}>Cancel</button></div>
    </div>
  )
}

function AddCards({ deck, today, onClose }: { deck: Deck; today: string; onClose: () => void }) {
  const [text, setText] = useState('')
  const parsed = parseCardLines(text)
  async function save() {
    for (const c of parsed) await repo.cards.put({ deckId: deck.id, front: c.front, back: c.back, ...newCardFields(today) })
    showToast(`Added ${parsed.length} ${parsed.length === 1 ? 'card' : 'cards'}.`)
    onClose()
  }
  return (
    <div className="form-grid">
      <label className="field full">One card per line: front | back<textarea autoFocus rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Mitochondria | powerhouse of the cell\nQuadratic formula | x = (-b ± √(b² - 4ac)) / 2a'} /></label>
      <p className="full sub">{parsed.length} {parsed.length === 1 ? 'card' : 'cards'} ready. A bar, a tab or “ - ” separates front and back.</p>
      <div className="actions full"><button className="btn" type="button" disabled={parsed.length === 0} onClick={save}>Add {parsed.length}</button><button className="btn ghost" type="button" onClick={onClose}>Cancel</button></div>
    </div>
  )
}

function Study({ deck, cards, today, examDate }: { deck: Deck; cards: Card[]; today: string; examDate?: string }) {
  const queue = dueCards(cards.filter((c) => c.deckId === deck.id), today)
  const [shown, setShown] = useState(false)
  const card = queue[0]
  async function grade(g: Grade) {
    await repo.cards.put(reviewCard(card, g, today, examDate))
    await repo.reviews.put({ cardId: card.id, localDate: today, grade: g })
    setShown(false)
  }
  if (!card) return <p>All caught up for today. Nice work.</p>
  return (
    <div className="study">
      <p className="mono">{queue.length} left today</p>
      <div className="flash" aria-live="polite">
        <p className="front">{card.front}</p>
        {shown && <p className="back">{card.back}</p>}
      </div>
      {!shown ? <button className="btn" type="button" autoFocus onClick={() => setShown(true)}>Show answer</button> : (
        <div className="respond" role="group" aria-label="How well did you know it?">
          {GRADE_LABELS.map((label, g) => <button key={label} type="button" onClick={() => grade(g as Grade)}>{label}</button>)}
        </div>
      )}
    </div>
  )
}

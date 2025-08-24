import React from 'react'
import Link from 'next/link'
import NotesLink from './notesLink'
import styles from './notesBtn.module.css'

const notesBtn = () => {
  return (
    <div>
      <div className={styles.notesBtn}>
        <NotesLink />
      </div>
    </div>
  )
}

export default notesBtn

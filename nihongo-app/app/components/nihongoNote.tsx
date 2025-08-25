import React from 'react'
import Note from './note'

const nihongoNote = () => {
  return (
    <div>
      <Note 
        japanese="こんにちは"
        furigana="konnichiha"
        translation="Hello"
      />
    </div>
  )
}

export default nihongoNote

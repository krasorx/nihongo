import React from 'react'
import Link from 'next/link'
import NoteTxt from '../../components/note';
import CreateNote from '../../components/createNote';

const endpoint: string = "http://localhost:3000/api/notes";

const CreateNotePage = () => {
  return (
    <div>
      <CreateNote endpoint={endpoint} />
    </div>
  )
}

export default CreateNotePage

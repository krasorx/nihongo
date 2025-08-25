import React from 'react'
import Link from 'next/link'
import NoteTxt from '../../components/note';
import CreateNote from '../../components/createNote';

const endpoint: string = "https://api.luisesp.cloud/api/notes";

const CreateNotePage = () => {
  return (
    <div>
      <CreateNote endpoint={endpoint} />
    </div>
  )
}

export default CreateNotePage

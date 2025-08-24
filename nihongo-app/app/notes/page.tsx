import React from 'react'
import Link from 'next/link'

interface Note {
    userId: number;
    id: number;
    title: string;
    body: string;
}

const notesPage = async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    const post = await res.json();

  return (
    <div>
      <h2>Notas</h2>
        {
            post.map((note: Note) => (
                <div key={note.id}>
                    <h3>{note.title}</h3>
                    <p>{note.body}</p>
                    <hr />
                </div>
            ))
        }
    </div>
  )
}

export default notesPage

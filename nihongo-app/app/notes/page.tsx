import React from 'react'
import Link from 'next/link'
import NoteTxt from '../components/note';

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
        <div>
          <NoteTxt 
            japanese='消えはしないで' 
            furigana='きれはしないで'
            translation='no desaparezca'
          />
          <NoteTxt 
            japanese="こんにちは"
            furigana="konnichiha"
            translation="Hello"
          />
        </div>
      <div>
        <p>"No desaparecerás, ni en la oscuridad más profunda puedes esconderte."</p>
        <p> "何処に居ようが 輝くものしか此処にない" en español se traduce como "Nada importa dónde estés, lo único que no hay aquí es la oscuridad".</p>
        <p> Día a día hay un avance y una regresión, no se puede estar tranquilo.</p>
        <p> "Incluso con las heridas interminables, el límite es lo mejor".</p>
        <p> "¿Qué es gracioso?"</p>
        <p> "「いつかきっと」じゃ何にも刺激はない</p>
        <p> Claro, la traducción al español es: "Ve hacia donde indique con seguridad el ritmo".</p>
        <p> "Haz que florezcan, haz que florezcamos, hasta que todos florezcamos."</p>
        <p> "El oscuro bosque que se aclara."</p>
        <p> Viajar no es sobre argumentos o razones lógicas.</p>
        <p> "Viva la vida cegera y florezca."</p>

      </div>
    </div>
  )
}

export default notesPage

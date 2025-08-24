import React from 'react'
import Link from 'next/link'

const usersPage = () => {
  return (
    <div>
        <div>
        Usuarios
        </div>
        <Link href="users/new">Crear Nuevo Usuario</Link>
    </div>
    
  )
}

export default usersPage

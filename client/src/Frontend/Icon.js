import React from 'react'

function Icon({ children, position }) {
    return (
        <>
            <i className={`bi bi-${ children } ${ position ? position : ''}`}></i>
        </>
    )
}

export default Icon
import React, { useEffect, useState } from 'react'

function ModalContents({isOpen}){
    const onMaskClick = (e) => {
        if(e.target === e.currentTatget){
            onClose(e);
        }
    }
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const contents = () => {
        if(isOpen){
            
        }
    }

    return (
        <div>
            Hi.
        </div>
    )
}
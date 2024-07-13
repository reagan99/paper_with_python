import { Link } from 'react-router-dom';
import React from 'react';
import './Nav.css';
import logo from '../img/icon1.png';
import logo_negative from '../img/icon3.png';
import web_name from '../img/web_name.png';
import { FaGithub } from "react-icons/fa";
import { IconContext } from "react-icons";

function Nav(){
    var git_link = "https://github.com/2023-Daebungi-Chatbot/main";
    var color =  '#016c0a';

    return (
        <div>
            <div className='navbar' style={{background: `linear-gradient(to bottom right, rgb(50, 155, 50), ${color})`}}>
                <Link className='navbarMenu' to={'/'}>
                    <img className='logoImage' src={logo_negative} width='100' height='100'/>
                </Link>
                <Link className='navbarMenuCenter' to={'/'}>
                    <img className='logoImage' src={web_name} width='350' height='45'/>
                </Link>
                <Link className='navbarMenu' onClick={() => window.open(git_link)} width='120'>
                    <FaGithub size={45}/>
                </Link>
            </div>
        </div>
    )
}

export default Nav;
import './Footer.css'
import symbolMark from '../img/SymbolMark.png'

const Footer = () => {
    const copyright = String.fromCodePoint(0x00A9);
    const year = '2023';
    const companyName = 'DAC';

    var color =  '#016c0a';

    return(
        <div className='footer' style={{background: `linear-gradient(to bottom right, rgb(50, 155, 50), ${color})`}}>
            <img className='contents' src={symbolMark} width={100} height={100}/>
            <span className='contents'>{`${copyright} ${year} ${companyName}`}</span>
        </div>   
    );
}

export default Footer;
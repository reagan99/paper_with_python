import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import './Table.css';

const Table = (props) => {
    var title = props.title;
    var content = props.content;
    var link = ""
    if(props.link != null){
        link = props.link;
    }
    
    return(
        <button className='btn' onClick={() =>{
            if(link !== ""){
                window.open(link)
            }}}>
            <View style={styles.button}>
                <Text style={textStyles.title}>{title}</Text>            
                <Text style={textStyles.content}>{content}</Text>            
            </View>
        </button>

    );
};

const styles = StyleSheet.create({
	button: {
        borderWidth: 5,
        borderRadius: 10,
        borderColor: '#119b1d',
        backgroundColor: '#119b1d',
        padding:'3px',
        textAlign: 'center',
        width: 300,
        height: '100%',
        justifyContent: 'center',
    },
});

const textStyles = StyleSheet.create({
    title:{
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content:{
        fontSize:16,
        fontWeight:'normal',
        color: 'white',
    }
})

export default Table;
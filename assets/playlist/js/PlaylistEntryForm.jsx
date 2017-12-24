import React from 'react';
import Autosuggest from 'react-autosuggest';

const match = require('autosuggest-highlight/match');
const parse = require('autosuggest-highlight/parse');

export default class PlaylistEntryForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            spindex: this.props.spindex,
            title: '',
            artist: '',
            album: '',
            label: ''
        };

        this.submit = this.submit.bind(this);
    }

    submit() {
        fetch('entry/add/', {
            method: "POST",
            body: new FormData(document.getElementById("add-form")),
            mode: 'cors'
        }).then(response => response.json()).then(json => {
            console.log(json);
            if (json.ok) this.props.addSpinToView(json.spin);
        });

        this.setState((state) => {
            return {
                spindex: state.spindex + 1,
                title: '',
                artist: '',
                album: '',
                label: ''
            }
        });
    }

    render() {
        return (
            <form className="entry-add-form" name='add-form' id="add-form">
                <div className="spin" id="new-entry">
                    <div className='playlist-movetab' style={{opacity:0.0}} />
                    <div className="playlist-numbering"> {this.state.spindex} </div>
                    <PlaylistEntryFormInput
                        identifier="title"
                        placeholder="song title"
                        value={this.state.title}
                        submit={this.submit}
                        autoFocus={true} />
                    <PlaylistEntryFormInput
                        identifier="artist"
                        placeholder="artist"
                        value={this.state.artist}
                        submit={this.submit}
                        autoFocus={false} />
                    <PlaylistEntryFormInput 
                        identifier="album"
                        placeholder="album"
                        value={this.state.album}
                        submit={this.submit}
                        autoFocus={false} />
                    <PlaylistEntryFormInput 
                        identifier="label"
                        placeholder="record label"
                        value={this.state.label}
                        submit={this.submit}
                        autoFocus={false} />
                    <div onClick={this.submit} className="playlist-plus clickable" id="add-entry-button">
                    </div>
                </div>
            </form>
        );
    }
}

// What does a suggestion look like when it's rendered
const renderSuggestion = (s, {query, isHighlighted}) => {
    let className = isHighlighted ? 'playlist-suggestion highlighted' : 'playlist-suggestion';
    const matches = match(s, query);
    const parts = parse(s, matches);

    let highlightedParts = parts.map((part, index) => {
        const weight = {
            fontWeight: part.highlight ? 'bold' : 'normal'
        };

        return (
            <span style={weight} key={index}>
                {part.text}
            </span>
        );
    })

    return (
        <div className={className}>
            {highlightedParts}
        </div>
    );
}

// Pass submit and autocomplete
class PlaylistEntryFormInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value,
            suggestions: []
        };

        this.onChange = this.onChange.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        this.shouldRenderSuggestions = this.shouldRenderSuggestions.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    }

    handleKeyUp(evt) { 
        if (evt.key == 'Enter') 
            this.props.submit(); 
    }

    onChange(evt, {newValue}) {
        this.setState({value: newValue});
    }

    // Autosuggest will call this function every time you need to update suggestions.
    // You already implemented this logic above, so just use it.
    onSuggestionsFetchRequested({ value }) {
        if (value.length === 0) {
            this.setState({suggestions: []});
            return;
        }

        fetch(`entry/complete/?identifier=${this.props.identifier}&value=${value}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        }).then(response => response.json()).then(data => {
            if (data.ok) {
                this.setState({suggestions: data.suggestions})
            }
        });
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested() {
        this.setState({
            suggestions: []
        });
    };

    shouldRenderSuggestions(value) {
        return value.trim().length > 2;
    }

    render() {
        const {value, suggestions} = this.state;

        const inputProps = {
            value,
            placeholder: this.props.placeholder,
            autoFocus: this.props.autoFocus,
            onChange: this.onChange
        };

        return (
            <div className="playlist-text-cell">
                <Autosuggest
                    id={this.props.identifier}
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    shouldRenderSuggestions={this.shouldRenderSuggestions}
                    getSuggestionValue={s => s}
                    renderSuggestion={renderSuggestion}
                    inputProps={inputProps} />
            </div>
        );
    }
}

// // Expects updateValue, a function
// class SuggestionsBox extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {
//             suggestions: this.props.suggestions,
//             selected: 0
//         }
//         this.renderSuggestions = this.renderSuggestions.bind(this);
//     }

//     clickedIt(suggestion, index) {
//         this.setState({selected: index});
//         this.props.updateValue(suggestion);
//     }

//     /* SOMEHOW WE WANT A FUNCTION BINDING KEYSTROKES TO CHANGING SELECTED, 
//        AND PICKING A VALUE ON KEYPRESS */ 
       
//     renderSuggestions() {
//         return this.props.suggestions.map((suggestion, index) => {
//             let customStyle = {};
//             if (index == this.state.selected)
//                 customStyle.backgroundColor = '#ffd';

//             return (
//                 <div
//                     key={index} 
//                     style={customStyle}
//                     onClick={e => this.clickedIt(suggestion, index)}
//                     className="playlist-suggestion"> 
//                     {suggestion} 
//                 </div>
//             );
//         });
//     }

//     render() {
//         if (this.props.suggestions.length > 0)
//             return (
//                 <div className="playlist-autocomplete-box">
//                     {this.renderSuggestions()} 
//                 </div>
//             );
//         else return null;
//     }
// }

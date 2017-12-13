import React from 'react';
import ReactDOM from 'react-dom';

import {SortableContainer,
		SortableElement,
		SortableHandle,
		arrayMove} from 'react-sortable-hoc';

const common = require('./common.js');

// Following syntax from online
const DragHandle = SortableHandle(() => <div className="playlist-movetab"/>);

const SortablePlaylistEntry =
	SortableElement(function({spin, spindex, removeSpinFromView, updateSpinInView}) {
	// Hacked to remove index keyword (demanded by Sortable Element)
	return (
		<PlaylistEntryContainer
			title={spin.title}
			artist={spin.artist}
			album={spin.album}
			label={spin.label||''}
			spindex={spindex}
			removeSpinFromView={removeSpinFromView}
			updateSpinInView={updateSpinInView} />
	);
});

const SortablePlaylistList =
	SortableContainer(({spins, removeSpinFromView, updateSpinInView}) => {
	// index MUST BE index in array or Sortable will blow up
	return (
		<div className='playlist-list-entries'>
		{spins.map((spin, index) => {
			return <SortablePlaylistEntry
				key={spin.id}
				spin={spin}
				spindex={index + 1}
				index={index}
				removeSpinFromView={removeSpinFromView}
				updateSpinInView={updateSpinInView} />
			}
		)}
		</div>
	);
});

class Playlist extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div id="container">
				<div id="col-left" className="col">
					<PlaylistDetails
						title={this.props.show.title}
						subtitle={this.props.show.subtitle}
						dj={this.props.show.dj}
						genre={this.props.show.genre}
						subgenre={this.props.show.subgenre}
						desc={this.props.show.desc} />
				</div>
				<div id="col-right" className="col">
					<SortablePlaylistTable spins={this.props.spins} />
				</div>
			</div>
		);
	}
}

class PlaylistDetails extends React.Component {
	constructor(props) {
		super(props)
	}

	renderDJs() {
		return this.props.dj.map( (dj) => (
			<span key={dj} className="show-dj-name tagged-item">{dj}</span>
		));
	}

	renderSubgenres() {
		return this.props.subgenre.map( (subgenre) =>
			<div key={subgenre} className="show-subgenre-name tagged-item">{subgenre}</div>
		)
	}

	render() {
		return (
			<div id="show" className="col-content">
				<div className="show-title show-section">
					<h2 className="show-title-text">{this.props.title}</h2>
					<h3 className="show-subtitle-text">{this.props.subtitle}</h3>
				</div>
				<div className="show-dj show-section">
					{this.renderDJs()}
				</div>
				<div className="show-desc show-section">
					<p className="show-desc-text">
						{this.props.desc}
					</p>
				</div>
				<div className="show-genre show-section">
					<div className="genre-heading">Genre</div>
					<span className="show-genre-name tagged-item">{this.props.genre}</span>
				</div>
				<div className="show-subgenre show-section">
					<span className="genre-heading">Sub-genre Tags</span>
					<div id="subgenre-input">New Sub-genre</div>
					<div className="subgenre-add-button">ADD</div>
					{this.renderSubgenres()}
				</div>
			</div>
		);
	}
}

class SortablePlaylistTable extends React.Component {
	constructor(props) {
		super(props);
		this.state = {spins:this.props.spins};

		this.addSpinToView      = this.addSpinToView.bind(this);
		this.removeSpinFromView = this.removeSpinFromView.bind(this);
		this.updateSpinInView   = this.updateSpinInView.bind(this);

		this.onSortEnd          = this.onSortEnd.bind(this);
	}

	updateSpinInView(spin) {
		let updatedSpins = this.state.spins.slice();
		updatedSpins[spin.spindex - 1] = spin;
		this.setState({ spins: updatedSpins });
	}

	addSpinToView(spin) {
		let updatedSpins = this.state.spins.slice();
		updatedSpins.push(spin);
		this.setState({ spins: updatedSpins});
	}

	removeSpinFromView(index) {
		let updatedSpins = this.state.spins.slice();
		updatedSpins.splice(index-1, 1);
		this.setState({ spins: updatedSpins });
	}

	onSortEnd({oldIndex, newIndex}) {
		let newState = { spins: arrayMove(this.state.spins, oldIndex, newIndex)}
		this.setState(newState);

		console.log(`moved ${oldIndex} to ${newIndex}`)
		// Move spin in the server
		if(oldIndex != newIndex)
			fetch('entry/move/', {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				body: JSON.stringify({oldSpindex: oldIndex+1, newSpindex: newIndex+1}),
				mode: 'cors',
				cache: 'default'
			}).then(response => {
				return response.json();
			}).then(data => {
				if(!data.success) {
					console.log("Ajax Error:");
					console.log(data);
					return;
				}
				console.log("Move: Success!");
				console.log(data);
			});
	};

	render() {
		return (
			<div id="playlist" className="col-content">
				<PlaylistTableHeader />
				<div className="playlist-table-contents">
					<SortablePlaylistList
						spins = {this.state.spins}
						updateSpinInView={this.updateSpinInView}
						removeSpinFromView={this.removeSpinFromView}
						onSortEnd={this.onSortEnd}
						useDragHandle={true} />
					<PlaylistEntryFormContainer
						key={this.state.spins.length + 1}
						spindex={this.state.spins.length + 1}
						addSpinToView={this.addSpinToView} />
				</div>
			</div>
		);
	}
}

class PlaylistTableHeader extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div id="playlist-header">
				<span className="playlist-numbering playlist-heading"> </span>
				<span className="playlist-numbering playlist-heading"> </span>
				<span className="playlist-text-cell playlist-heading"> {this.props.title} </span>
				<span className="playlist-text-cell playlist-heading"> {this.props.artist} </span>
				<span className="playlist-text-cell playlist-heading"> {this.props.album} </span>
				<span className="playlist-text-cell playlist-heading"> {this.props.label} </span>
				<span className="playlist-numbering playlist-heading"> </span>
			</div>
		);
	}
}

PlaylistTableHeader.defaultProps = {
	title: 	'title',
	artist: 'artist',
	album: 	'album',
	label: 	'record label'
}

class PlaylistEntryContainer extends React.Component {
	constructor(props) {
		super(props);

		this.setEntry = this.setEntry.bind(this);
		this.setInput = this.setInput.bind(this);

		this.deleteSpinFromDB = this.deleteSpinFromDB.bind(this);
		this.updateSpinInDB   = this.updateSpinInDB.bind(this);

		this.state = {
			entry: undefined,
			inputs: {}
		}
	}

	setEntry(c) { this.setState({entry: c}) }

	setInput(c) {
		let isMount = (c==null? false:true);
		if(isMount) {
			this.setState((state) => {
				let newInputs = state.inputs;
				newInputs[c.state.name] = c;
				return {
					inputs: newInputs
				}
			});
		}
	}

	deleteSpinFromDB() {
		// Close all inputs (for a small bug)
		for(let inputKey of Object.keys(this.state.inputs))
			this.state.inputs[inputKey].setState({editing:false})

		// Remove spin from the server
		fetch('entry/delete/', {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: JSON.stringify({index: this.props.spindex}),
			mode: 'cors',
			cache: 'default'
		}).then(response => {
			return response.json();
		}).then(data => {
			if(!data.success) {
				console.log("Ajax Error:");
				console.log(data);
				return;
			}
			console.log("Ajax: Success!");
			console.log(data);
			this.props.removeSpinFromView(this.props.spindex);
		});
	}

	updateSpinInDB() {
		// Build body of request
		let body = { index: this.props.spindex }
		for(let inputKey of Object.keys(this.state.inputs))
			body[inputKey] = this.state.inputs[inputKey].state.value;

		// Update spin in the server
		fetch('entry/update/', {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: JSON.stringify(body),
			mode: 'cors',
			cache: 'default'
		}).then(response => {
			return response.json();
		}).then(data => {
			if(!data.success) {
				console.log("Ajax Error:");
				console.log(data);
				return;
			}
			console.log(data);
			this.props.updateSpinInView(data.spin);
		});
	}


	render() {
		// console.log("here's our entry container...");
		// console.log(this);
		return (
			<PlaylistEntry
				spindex={this.props.spindex}
				title={this.props.title}
				artist={this.props.artist}
				album={this.props.album}
				label={this.props.label}
				delete={this.deleteSpinFromDB}
				update={this.updateSpinInDB}
				ref={this.entrySet}
				setInput={this.setInput} />
		);
	}
}
class PlaylistEntry extends React.Component {
	constructor(props) {
		super(props)
	}

	renderArtists() {
		return this.props.artists.map( (artistName) =>
			// Todo: replace this with a component with support for clicking and editing artists
			<span key={artistName} className="playlist-artist-name tagged-item">{artistName}</span>
		);
	}

	render() {
		return (
			<div className="spin">
				<DragHandle />
				<div className="playlist-numbering"> {this.props.spindex} </div>
				<ReactiveTextInput
					ref={this.props.setInput}
					value={this.props.title}
					name='title'
					inDB={true}
					update={this.props.update}
					delete={this.props.delete}
					autocomplete={empty => null}/>
				<ReactiveTextInput
					ref={this.props.setInput}
					value={this.props.artist}
					name='artist'
					inDB={true}
					update={this.props.update}
					delete={this.props.delete}
					autocomplete={empty => null}/>
				<ReactiveTextInput
					ref={this.props.setInput}
					value={this.props.album}
					name='album'
					inDB={true}
					update={this.props.update}
					delete={this.props.delete}
					autocomplete={empty => null}/>
				<ReactiveTextInput
					ref={this.props.setInput}
					value={this.props.label}
					name='label'
					inDB={true}
					update={this.props.update}
					delete={this.props.delete}
					autocomplete={empty => null}/>
				<div className="playlist-minus clickable" onClick={this.props.delete}> </div>
				<div className="playlist-comment clickable"> </div>
			</div>
		);
	}
}

class PlaylistEntryFormContainer extends React.Component {
	constructor(props) {
		super(props)
		this.addSpinToDB = this.addSpinToDB.bind(this);
	}

	// makeHeaders() {
	// 	let headers = new Headers();
	// 	let csrftoken = common.getCookie('csrftoken')
	// 	headers.append("X-CSRFToken", csrftoken);
	// 	return headers;
	// }

	addSpinToDB() {
		// Post new spin to the server
		fetch('entry/add/', {
			method: "POST",
			body: new FormData(document.getElementById("add-form")),
			mode: 'cors',
			cache: 'default'
		}).then(response => {
			return response.json();
		}).then(data => {
			if(!data.success) {
				console.log("Ajax Error:");
				console.log(data);
				return;
			}
			console.log('add success!');
			console.log(data);
			this.props.addSpinToView(data.spin);
		});
	}

	render() {
		return (
			<PlaylistEntryForm
				spindex={this.props.spindex}
				addSpinToDB={this.addSpinToDB}/>
		);
	}
}
class PlaylistEntryForm extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			spindex: this.props.spindex,
			title: '',
			artist: '',
			album: '',
			label: ''
		}

		this.submit = this.submit.bind(this);
	}
	submit() {
		this.props.addSpinToDB();
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
						name="title"
						placeholder="song title"
						value={this.state.title}
						submit={this.submit}
						autoFocus={true}
						autocomplete={empty => null}
					/>
					<PlaylistEntryFormInput
						name="artist"
						placeholder="artist"
						value={this.state.artist}
						submit={this.submit}
						autoFocus={false}
						autocomplete={empty => null}
					/>
					<PlaylistEntryFormInput
						name="album"
						placeholder="album"
						value={this.state.album}
						submit={this.submit}
						autoFocus={false}
						autocomplete={empty => null}
					/>
					<PlaylistEntryFormInput
						name="label"
						placeholder="album label"
						value={this.state.label}
						submit={this.submit}
						autoFocus={false}
						autocomplete={empty => null}
					/>
					<div onClick={this.submit} className="playlist-plus clickable" id="add-entry-button">
					</div>
				</div>
			</form>
		);
	}
}
// Pass submit and autocomplete
class PlaylistEntryFormInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value: this.props.value};

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.updateValue  = this.updateValue.bind(this);
	}

	handleKeyDown(e) {
		if(e.key == 'Enter') this.props.submit();
		else this.props.autocomplete(this.props.name, e.target.value);
	}

	updateValue(e)   { this.setState({value: e.target.value}); }

	render() {
			return (
				<div className="playlist-text-cell">
					<input
						autoFocus={this.props.autoFocus}
						type="text"
						value={this.state.value}
						name={this.props.name}
						placeholder={this.props.placeholder}
						onChange={this.updateValue}
						onKeyDown={this.handleKeyDown}/>
				</div>
				);
	}
}

// Pass update, delete, and autocomplete
class ReactiveTextInput extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			value: this.props.value,
			name:  this.props.name,
			placeholder: this.props.placeholder,
			editing: this.props.editing
		}

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.updateValue  = this.updateValue.bind(this);
		this.toggleEditing = this.toggleEditing.bind(this);
	}

	handleKeyDown(e) {
		// Delete case
		if(e.metaKey) {
			if(e.key == 'Backspace') {
				this.toggleEditing();
				this.props.delete();
				return;
			}
		}

		// Update case
		if(e.key == 'Enter') {
			this.toggleEditing();
			this.props.update();
			return;
		}

		// Autocomplete case
		this.props.autocomplete(this.state.name, e.target.value);
	}

	updateValue(e)  {this.setState({value:e.target.value});}
	toggleEditing() {this.setState(state => {return {editing: !state.editing}})}

	render() {
		if(this.state.editing) {
			return (
				<div className="playlist-text-cell dbl-clickable"
					 onDoubleClick={this.toggleEditing}>
						<input
							type="text"
							name={this.state.name}
							value={this.state.value}
							placeholder={this.state.placeholder}
							onChange={this.updateValue}
							onKeyDown={this.handleKeyDown}/>
				</div>
			)
		}
		else if(!this.state.editing) {
			return (
				<div className="playlist-text-cell dbl-clickable"
					 onDoubleClick={this.toggleEditing}>
					{this.state.value}
				</div>
			);
		}
	}
}

ReactDOM.render(
    React.createElement(Playlist, window.props),
    window.react_mount,
)

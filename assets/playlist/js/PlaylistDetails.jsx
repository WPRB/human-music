import React from 'react';
import TagBox from './TagBox.jsx'
import { RIEInput, RIETextArea, RIETags } from 'riek';

export default class PlaylistDetails extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			title: this.props.title,
			subtitle: this.props.subtitle,
			djs: this.props.dj,
			genre: this.props.genre,
			subgenre: this.props.subgenre,
			desc: this.props.desc
		}

		this.update = this.update.bind(this);
		this.addSubgenre = this.addSubgenre.bind(this);
	}

	update(value) {
		let endpoint = Object.keys(value)[0];

		fetch(`meta/${endpoint}/`, {
			method: "PUT",
			body: JSON.stringify(value),
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
		}).then(response => {
			console.log(response.json());
		});

		this.setState(value);
	}

	addSubgenre(value) {
		console.log('TRYNA ADD BROH');
		fetch(`meta/add_subgenre/`, {
			method: "PUT",
			body: JSON.stringify({subgenre: value}),
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
		}).then(response => {
			console.log(response.json());
		});
	}

	delSubgenre(value) {
		fetch(`meta/del_subgenre/`, {
			method: "DELETE",
			body: JSON.stringify({subgenre:value}),
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
		}).then(response => {
			console.log(response.json());
		});
	}

	render() {
		return (
			<div id="show" className="col-content">
				<div className="show-title show-section">
					<h2 className="show-title-text">
						{this.props.title}
					</h2>
					<h3 className="show-subtitle-text">
						<RIEInput
							value={this.state.subtitle}
							change={this.update}
							propName="subtitle" />
					</h3>
				</div>
				<div className="show-dj-name show-section">
					{/*this.renderDJs()*/}
				</div>
				<div className="show-desc show-section">
				<div className="desc-heading">Description</div>
				<div className="section-title-underline"></div>
					<div className="show-desc-text">
						<RIETextArea
							value={this.state.desc || 'write your own description!'}
							change={this.update}
							propName="desc" />
					</div>
				</div>
				<div className="show-genre show-section">
					<div className="genre-heading">Genre</div>
					<div className="section-title-underline"></div>
						<RIEInput
							value={this.state.genre || 'write your own genre!'}
							change={this.update} 
							propName="genre" />
					</div>
				<div className="show-subgenre show-section">
					<div className="genre-heading">Sub-genres</div>
					<div className="section-title-underline"></div>
					<TagBox 
						tags={this.state.subgenre}
						type="sub-genre"
						inputId="subgenre-input"
						placeholder="Add a tag!"
						allownone="True"
						addTag={this.addSubgenre}
						delTag={this.delSubgenre} />
				</div>
			</div>
		);
	}
}

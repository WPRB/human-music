import React from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';

import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css';
import 'react-virtualized-select/styles.css';

class Search extends React.Component {
  constructor (props) {
    super(props)
	this.displayOrder = ['songs', 'artists', 'albums', 'djs', 'shows', 'labels']
	this.myWidth = 300
	this.state = {
		query: '',
		options: [],
		redirect: false
		};
	this.makeQuery = this.makeQuery.bind(this);
	this.explore = this.explore.bind(this);
  }

  makeQuery(query) {
	  // don't search on empty query
	  if (query == '') return
	  // make ajax request
	  fetch('/playlist/search/?query=' + query, {
		  method: "GET",
		  headers: {
			  "Content-Type": "application/json",
			  "Accept": "application/json"
		  },
		  mode: 'cors',
		  cache: 'default'
	  }).then(response => {
		  return response.json();
	  }).then(data => {

		  var results = []
		  //results.append(data['songs'].slice(0:2)['name'])
		  //this.setState({options: [], query: query})
		  //console.log(this.state.options)

		  var i, j;
		  var category;
		  for (i = 0; i < this.displayOrder.length; i++) {
			  category = this.displayOrder[i]
			  var upperBound = 3;
			  if (data[category].length < 3) {
				  upperBound = data[category].length;
			  }

			  for (j = 0; j < upperBound; j++) {
				  results.push({
					  label: data[category][j]['name'],
					  value: data[category][j]['id'],
				  	  category: category});
			  }
		  }
		  console.log(results);
		  this.setState({
			  query: query,
			  options: results,
		  	  redirect: false})
	  });
  }

  explore(selection) {
	  console.log(selection)

	  var category = selection['selectValue']['category']
	  category = category.substring(0, category.length-1)
	  var id = selection['selectValue']['value']
	  window.location.href = `/explore/${category}/${id}/`;
  }

  render () {
	const styles = {
		//display: 'inline-block',
		width: this.myWidth
	};

    return (
		<div id="select-search-bar" style={{ display: 'inline-block', maxWidth: this.myWidth }}>
	      <Select
	        options={this.state.options}
			onChange={(selectValue) => this.explore({selectValue})}
			onInputChange={(selectValue) => this.makeQuery(selectValue)}
	        value={this.state.selectValue}
			placeholder="Search"
			style={styles} />
  		</div>
    )
  }
}

ReactDOM.render(
    React.createElement(Search, window.props),
    window.react_mount,
);

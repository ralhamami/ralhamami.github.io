const table = document.querySelector('table');
const dateInput = document.querySelector('#date');
const weightInput = document.querySelector('#weight');
const fatInput = document.querySelector('#fat');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');

let db;

var ctx = document.getElementById('chart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: [],
        datasets: [{
            label: 'Weight',
            backgroundColor: 'rgb(25, 25, 25)',
            borderColor: 'rgb(25, 25, 25)',
            data: [],
			fill:'false'
        },{
            label: 'Fat',
            backgroundColor: 'rgb(150, 150, 150)',
            borderColor: 'rgb(150, 150, 150)',
            data: [],
			fill:'false'
        }]
    },

    // Configuration options go here
    options: {}
});

window.onload = function(){
	//Open database. Create if it doesn't exist.
	let request = window.indexedDB.open('weightandfat_db',1);
	
	request.onerror = function(){
		console.log('Database failed to open');
	};
	
	request.onsuccess = function(){
		console.log('Database opened successfully');
		
		// Store the opened database object in the db variable.
		db = request.result;
		
		displayWeightAndFat();
	};
	
	request.onupgradeneeded = function(e){
		let db = e.target.result;
		
		let objectStore = db.createObjectStore('weightandfat_os', { keyPath: 'id', autoIncrement:true });
		
		objectStore.createIndex('date', 'date', { unique: false });
		objectStore.createIndex('weight', 'weight', { unique: false });
		objectStore.createIndex('fat', 'fat', { unique: false });

		console.log('Database setup complete');
	};
	
	form.onsubmit = addData;
	
	function addData(e){
		e.preventDefault();
		
		let newItem = {date: dateInput.value, weight: weightInput.value, fat: fatInput.value};
		
		let transaction = db.transaction(['weightandfat_os'],'readwrite');
		
		let objectStore = transaction.objectStore('weightandfat_os');
		
		let request = objectStore.add(newItem);
		request.onsuccess = function(){
			//addChartData(chart,dateInput.value,[weightInput.value,fatInput.value]);
			dateInput.value = '';
			weightInput.value = '';
			fatInput.value = '';
		};
		
		transaction.oncomplete = function(){
			console.log('Transaction completed: database modification finished.');
			displayWeightAndFat();
		};
		
		transaction.onerror = function(){
			console.log('Transaction not opened due to error');
		};
	}
	
	function displayWeightAndFat(){
		while (table.children.length > 1){
			table.removeChild(table.children[1]);
		}
	
		let objectStore = db.transaction('weightandfat_os').objectStore('weightandfat_os');
		removeData(chart);
		objectStore.openCursor().onsuccess = function(e){
			let cursor = e.target.result;
			if (cursor){
				const tableRow = document.createElement('tr');
				const date = document.createElement('td');
				const weight = document.createElement('td');
				const fat = document.createElement('td');
				const deleteCell = document.createElement('td');
				
				tableRow.appendChild(date);
				tableRow.appendChild(weight);
				tableRow.appendChild(fat);
				table.appendChild(tableRow);
				
				date.textContent = cursor.value.date;
				weight.textContent = cursor.value.weight;
				fat.textContent = cursor.value.fat;
				
				tableRow.setAttribute('data-entry-id', cursor.value.id);
				
				addChartData(chart,cursor.value.date,[cursor.value.weight,cursor.value.fat]);
				chart.update();
				const deleteBtn = document.createElement('button');
				deleteCell.appendChild(deleteBtn);
				tableRow.appendChild(deleteCell);
				deleteBtn.textContent = 'Delete';
				
				deleteBtn.onclick = deleteItem;
				
				cursor.continue();
			}
			console.log('All measurements displayed.');
		};
	}
	
	function deleteItem(e){
		let entryId = Number(e.target.parentNode.parentNode.getAttribute('data-entry-id'));
		
		let transaction = db.transaction(['weightandfat_os'], 'readwrite');
		let objectStore = transaction.objectStore('weightandfat_os');
		let request = objectStore.delete(entryId);
		let chartIndex;
		
		transaction.oncomplete = function(){
			
			e.target.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode);
			console.log('Entry ' + entryId + ' deleted.');
			
			//Find index to remove from chart.
			for (i=0; i<chart.data.labels.length; i++){
				if (chart.data.labels[i] === e.target.parentNode.parentNode.children[0].textContent){
					chartIndex = i;
					break;
				}
			}
			
			chart.data.labels.splice(chartIndex,1);
			chart.data.datasets[0].data.splice(chartIndex,1);
			chart.data.datasets[1].data.splice(chartIndex,1);
			chart.update();
		};
	}
	
	function addChartData(chart, label, data) {
		chart.data.labels.push(label);
		chart.data.datasets[0].data.push(data[0]);
		chart.data.datasets[1].data.push(data[1]);
		chart.update();
	}
	
	function removeData(chart) {
		chart.data.labels.pop();
		chart.data.datasets.forEach((dataset) => {
			dataset.data.pop();
		});
		chart.update();
	}
}
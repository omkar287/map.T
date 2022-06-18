'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


let map, mapEvent;




class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;

    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        console.log(this.type[0]);
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}



class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, candence) {

        super(coords, distance, duration);
        this.candence = candence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }


}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {

        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


//const run1 = new running([39, -12], 5.2, 24, 178);
//const cycling1 = new Cycling([39, -12], 27, 95, 523);
//console.log(run1, cycling1);






//////APPLICATION            //////////////////////////////////////

let type;
class App {
    #map;
    #mapEvent;
    #workouts = [];
    #getZoom = 13;
    constructor() {
        this._getPosition();

        //get local Storage

        this._getLocalStorage();


        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('could not get your position');
            });

    }

    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        console.log(this);
        //add your location to map
        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);



        //add marker
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMark(work);

        });

    }


    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus();

    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    ;
    _newWorkout(e) {

        const validinput = (...input) => input.every(inp => Number.isFinite(inp));
        const allPositive = (...input) => input.every(inp => inp > 0);

        e.preventDefault();

        // Get data from form

        const type = inputType.value;
        console.log(type)
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // check if data is valid



        //if workout is Running
        if (type === 'running') {
            const candence = +inputCadence.value;                   ///go to 125
            if (!validinput(distance, duration, candence) || !allPositive(distance, duration, candence))
                return alert('Input have to be positive number')
            workout = new Running([lat, lng], distance, duration, candence);


        }

        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validinput(distance, duration, elevation) || !allPositive(distance, duration))
                return alert('Input have to be positive number')

            workout = new Cycling([lat, lng], distance, duration, elevation);

        }

        this.#workouts.push(workout);
        console.log(workout)
        //render workout on map as market

        this._renderWorkoutMark(workout);
        this._renderWorkout(workout);

        this._hideForm();
        // console.log(this.#mapEvent);

        this._setLocalStorage();

    }


    _renderWorkoutMark(workout) {

        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({

                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`).openPopup();
    }


    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">27</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
       `;


        if (workout.type === 'running') {
            html += `
           <div class="workout__details">
           <span class="workout__icon">⚡️</span>
           <span class="workout__value">${workout.pace.toFixed(1)}</span>
           <span class="workout__unit">min/km</span>
         </div>
         <div class="workout__details">
           <span class="workout__icon">🦶🏼</span>
           <span class="workout__value">${workout.candence}</span>
           <span class="workout__unit">spm</span>
         </div>
       </li>`
        }

        if (workout.type === 'cycling') {
            html += `
           <div class="workout__details">
           <span class="workout__icon">⚡️</span>
           <span class="workout__value">${workout.speed.toFixed(1)}</span>
           <span class="workout__unit">min/km</span>
         </div>
         <div class="workout__details">
           <span class="workout__icon">🦶🏼</span>
           <span class="workout__value">${workout.elevationGain}</span>
           <span class="workout__unit">spm</span>
         </div>
       </li>`
        }


        form.insertAdjacentHTML('afterend', html)

    }


    _moveToPopup(e) {


        const workoutEL = e.target.closest('.workout');
        console.log(workoutEL);

        console.log(this.#workouts)
        if (!workoutEL) return;

        const workout = this.#workouts.find(work => work.id === workoutEL.dataset.id);

        console.log(workout)

        this.#map.setView(workout.coords, this.#getZoom, {
            Animate: true,                         ///////////   click to go there at MAP   IMP
            pan: {
                duration: 1
            }
        })
    }


    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts))
    }



    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));
        console.log(data);

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);

        });

    }

}

const app = new App();

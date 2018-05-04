const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');

const clarifai = new Clarifai.App({
 apiKey: 'f0fd013f0d15476eade3dacecc2101b9'
});

const handleApiCall = (req, res) => {
	clarifai.models.predict(Clarifai.FACE_DETECT_MODEL,req.body.input)
		.then(data => res.json(data))
		.catch(err => res.status(400).json('unable to work with API'));
}
const db = knex({
	client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'khong nho',
    database : 'smart-brain'
  }
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.json(database.users);
})

//Sign In page
app.post('/signin', (req, res) => {
	const {email, password} = req.body;
	if(!email || !password){
		return res.status(400).json('incorrect form submission');
	}
	db.select('email','hash').from('login')
		.where('email','=',email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if(isValid){
				return db.select('*').from('users').where('email','=',email)
					.then(user => {
						return res.json(user[0]);
					})
					.catch(err => res.status(400).json('unable to get user'));
			}
		})
		.catch(err => res.status(400).json('wrong credentials'));
})

//Register Page
app.post('/register', (req, res) => {
	const {email, name, password} = req.body;
	if(!email || !name || !password){
		return res.status(400).json('incorrect form submission');
	}
	const hash = bcrypt.hashSync(password, 10);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email,
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
			})
			.then(user => {
				return res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('Unable to register!!!'));
})

//Profile
app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	let found = false;
	db.select('*').from('users').where({id})
		.then(user => {
			if(user.length){
				return res.json(user[0]);
			} else {
				return res.status(400).json('Not found');
			}
		})
		.catch(err => {
			return res.status(400).json('error getting user');
		})
})

//Image
app.put('/image', (req, res) => {
	const {id} = req.body;
	db('users').where('id','=',id)
		.increment('entries',1)
		.returning('entries')
		.then(entries => {
			return res.json(entries[0]);
		})
		.catch(err => res.status(400).json('unable to get entries'));
})

//ImageURL
app.post('/imageurl', (req, res) => {
	handleApiCall(req,res);
})
// //Encrypt password asycn
// bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
//   // Store hash in your password DB.
// });
// // Load hash from your password DB.
// bcrypt.compare(myPlaintextPassword, hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare(someOtherPlaintextPassword, hash, function(err, res) {
//     // res == false
// });

app.listen(3000, () => {
	console.log('app is running on port 3000');
});
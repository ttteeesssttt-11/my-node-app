const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello from render!');
});

const PORT = process.env.PORT || 5000;
const dbPath = 'mydatabase.db';

app.listen(PORT, () => console.log(`server running on port ${PORT}`));

app.get('/all', (req, res) => {
  const db = new Database(dbPath);
  const result = {
    home: db.prepare(`SELECT * FROM home WHERE id=?`).get(1),
    about: db.prepare(`SELECT * FROM home WHERE id=?`).get(2),
    political: db.prepare(`SELECT * FROM home WHERE id=?`).get(3),
    pro: {
      content: db.prepare(`SELECT * FROM pro_content WHERE id=?`).get(1),
      exp: db.prepare(`SELECT * FROM pro_exp`).all(),
      expert: db.prepare(`SELECT * FROM pro_expert`).all()
    },
    recent: {
      category: db.prepare(`SELECT * FROM recent_category`).all(),
      project: db.prepare(`SELECT * FROM recent_project`).all()
    },
    pub: {
      category: db.prepare(`SELECT * FROM pub_category`).all(),
      pub: db.prepare(`SELECT * FROM pub_pub`).all()
    },
    exp: db.prepare(`SELECT * FROM my_exp`).all(),
    previous: db.prepare(`SELECT * FROM previous`).all(),
    pexp: db.prepare(`SELECT * FROM political_exp`).all(),
    ppub: db.prepare(`SELECT * FROM political_pub`).all(),
    contact: db.prepare(`SELECT * FROM contact WHERE id=?`).get(1)
  }
  db.close;

  return res.status(200).json(result);
})

app.post('/signin', (req, res) => {
  const db = new Database(dbPath);
  const result = db.prepare(`SELECT password FROM admin WHERE id=?`).get(1);
  db.close();

  if (result.password === req.body.password) {
    return res.status(200).json({});
  } else {
    return res.status(404).json({ msg: 'Password Incorrect' });
  }
})

app.post('/setHome', (req, res) => {
  const db = new Database(dbPath);
  db.prepare(`UPDATE home SET title = ?, subtitle = ? WHERE id = 1`).run(req.body.title, req.body.subtitle);
  db.close();
  return res.status(200).json({});
})

app.post('/setPro', (req, res) => {
  const db = new Database(dbPath);
  db.prepare(`UPDATE pro_content SET content=? WHERE id=1`).run(req.body.content.content);
  db.close();
  changeTable('pro_exp', req.body.exp);
  changeTable('pro_expert', req.body.expert);
  return res.status(200).json({});
})

app.post('/setRecentCategory', (req, res) => {
  changeTable('recent_category', req.body);

  const db = new Database(dbPath);
  const hasId = req.body.filter(v => Object.keys(v).includes('id'));
  db.prepare(`DELETE FROM recent_project WHERE category NOT IN (${Array(hasId.length).fill('?').join(', ')})`).run(hasId.map(v => v.id));
  const result = db.prepare(`SELECT * FROM recent_category`).all();
  db.close();

  return res.status(200).json(result);
})

app.post('/setRecentProject', (req, res) => {
  changeTable('recent_project', req.body);

  const db = new Database(dbPath);
  const result = db.prepare(`SELECT * FROM recent_project`).all();
  db.close();

  return res.status(200).json(result);
})

app.post('/setPubCategory', (req, res) => {
  changeTable('pub_category', req.body);

  const db = new Database(dbPath);
  const hasId = req.body.filter(v => Object.keys(v).includes('id'));
  db.prepare(`DELETE FROM pub_pub WHERE category NOT IN (${Array(hasId.length).fill('?').join(', ')})`).run(hasId.map(v => v.id));
  const result = db.prepare(`SELECT * FROM pub_category`).all();
  db.close();

  return res.status(200).json(result);
})

app.post('/setPubPub', (req, res) => {
  changeTable('pub_pub', req.body);

  const db = new Database(dbPath);
  const result = db.prepare(`SELECT * FROM pub_pub`).all();
  db.close();

  return res.status(200).json(result);
})

app.post('/setPub', (req, res) => {
  changeTable('pub_category', req.body.category);
  changeTable('pub_pub', req.body.pub);
  return res.status(200).json({});
})

app.post('/setAbout', (req, res) => {
  const db = new Database(dbPath);
  db.prepare(`UPDATE home SET title = ?, subtitle = ? WHERE id = 2`).run(req.body.title, req.body.subtitle);
  db.close();
  return res.status(200).json({});
})

app.post('/setExp', (req, res) => {
  changeTable('my_exp', req.body);
  return res.status(200).json({});
})

app.post('/setPrevious', (req, res) => {
  changeTable('previous', req.body);
  return res.status(200).json({});
})

app.post('/setPolitical', (req, res) => {
  const db = new Database(dbPath);
  db.prepare(`UPDATE home SET title = ?, subtitle = ? WHERE id = 3`).run(req.body.title, req.body.subtitle);
  db.close();
  return res.status(200).json({});
})

app.post('/setPExp', (req, res) => {
  changeTable('political_exp', req.body);
  return res.status(200).json({});
})

app.post('/setPPub', (req, res) => {
  changeTable('political_pub', req.body);
  return res.status(200).json({});
})

app.post('/setContact', (req, res) => {
  const db = new Database(dbPath);
  db.prepare(`UPDATE contact SET email=?, linkedin=? WHERE id=1`).run(req.body.email, req.body.linkedin);
  db.close();
  return res.status(200).json({});
})

const changeTable = (table, obj) => {
  const db = new Database(dbPath);
  const hasId = obj.filter(v => Object.keys(v).includes('id'));
  db.prepare(`DELETE FROM ${table} WHERE id NOT IN (${Array(hasId.length).fill('?').join(', ')})`).run(hasId.map(v => v.id));
  hasId.map(v => {
    const fields = Object.keys(v).filter(f => f !== 'id');
    db.prepare(`UPDATE ${table} SET ${fields.map(m => `${m}=?`).join(', ')} WHERE id=?`).run(fields.map(m => v[m]), v.id);
  });
  const hasnotId = obj.filter(v => !/\d/.test(v.id));
  hasnotId.map(v => {
    const fields = Object.keys(v).filter(f => f !== 'id');
    db.prepare(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${Array(fields.length).fill('?').join(', ')})`).run(fields.map(m => v[m]));
  })
  db.close();
}
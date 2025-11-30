const db = require('../config/database');

const getClients = (req, res) => {
  db.all(
    `SELECT c.*, COUNT(p.id) as projectCount
     FROM clients c
     LEFT JOIN projects p ON c.id = p.clientId
     GROUP BY c.id
     ORDER BY c.createdAt DESC`,
    (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch clients' });
      }
      res.json({ clients: clients || [] });
    }
  );
};

const createClient = (req, res) => {
  const { name, email, phone, company, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }

  db.run(
    `INSERT INTO clients (name, email, phone, company, address)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || '', company || '', address || ''],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Failed to create client' });
      }
      res.status(201).json({ message: 'Client created', clientId: this.lastID });
    }
  );
};

const updateClient = (req, res) => {
  const clientId = req.params.id;
  const { name, email, phone, company, address, status } = req.body;

  db.run(
    `UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, address = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, email, phone, company, address, status, clientId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update client' });
      }
      res.json({ message: 'Client updated' });
    }
  );
};

const deleteClient = (req, res) => {
  const clientId = req.params.id;

  db.run('DELETE FROM clients WHERE id = ?', [clientId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete client' });
    }
    res.json({ message: 'Client deleted' });
  });
};

module.exports = { getClients, createClient, updateClient, deleteClient };

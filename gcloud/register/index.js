const { Expo } = require('expo-server-sdk');
const mysql = require('promise-mysql');

exports.register = (req, res) => {
  // if (req.method !== 'POST') {
  //   res.status(404).end();
  // }
  //
  // switch (req.get('content-type')) {
  //   // '{"name":"John"}'
  //   case 'application/json':
  //     // ({name} = req.body);
  //     break;
  //   // 'name=John' in the body of a POST request (not the URL)
  //   case 'application/x-www-form-urlencoded':
  //     // ({name} = req.body);
  //     break;
  //   default:
  //     return res.status(503).end();
  // }

  // const receipts = handlePushTokens(req.body);
  // console.log(`Received message, with title: ${req.body.title}`);

  res.status(200).json({});
};

// [START cloud_sql_mysql_mysql_create]
let pool;
const createPool = async () => {
  pool = await mysql.createPool({
    user: process.env.DB_USER, // e.g. 'my-db-user'
    password: process.env.DB_PASS, // e.g. 'my-db-password'
    database: process.env.DB_NAME, // e.g. 'my-database'
    // If connecting via unix domain socket, specify the path
    socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    // If connecting via TCP, enter the IP and port instead
    // host: 'localhost',
    // port: 3306,

    //[START_EXCLUDE]

    // [START cloud_sql_mysql_mysql_limit]
    // 'connectionLimit' is the maximum number of connections the pool is allowed
    // to keep at once.
    connectionLimit: 5,
    // [END cloud_sql_mysql_mysql_limit]

    // [START cloud_sql_mysql_mysql_timeout]
    // 'connectTimeout' is the maximum number of milliseconds before a timeout
    // occurs during the initial connection to the database.
    connectTimeout: 10000, // 10 seconds
    // 'acquireTimeout' is the maximum number of milliseconds to wait when
    // checking out a connection from the pool before a timeout error occurs.
    acquireTimeout: 10000, // 10 seconds
    // 'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    waitForConnections: true, // Default: true
    // 'queueLimit' is the maximum number of requests for connections the pool
    // will queue at once before returning an error. If 0, there is no limit.
    queueLimit: 0, // Default: 0
    // [END cloud_sql_mysql_mysql_timeout]

    // [START cloud_sql_mysql_mysql_backoff]
    // The mysql module automatically uses exponential delays between failed
    // connection attempts.
    // [END cloud_sql_mysql_mysql_backoff]

    //[END_EXCLUDE]
  });
};
createPool();
// [END cloud_sql_mysql_mysql_create]

const ensureSchema = async () => {
  // Wait for tables to be created (if they don't already exist).
  await pool.query(
    `CREATE TABLE IF NOT EXISTS users
      ( vote_id SERIAL NOT NULL,
        time_cast timestamp NOT NULL,
        candidate CHAR(6) NOT NULL,
        PRIMARY KEY (vote_id) );`
  );
};
ensureSchema();

const registerUser = (req, res) => {
  const {team} = req.body;
  const timestamp = new Date();

  if (!team || (team !== 'TABS' && team !== 'SPACES')) {
    res.status(400).send('Invalid team specified.').end();
  }

  // [START cloud_sql_mysql_mysql_connection]
  try {
    const stmt = 'INSERT INTO votes (time_cast, candidate) VALUES (?, ?)';
    // Pool.query automatically checks out, uses, and releases a connection
    // back into the pool, ensuring it is always returned successfully.
    pool.query(stmt, [timestamp, team]);
  } catch (err) {
    // If something goes wrong, handle the error in this section. This might
    // involve retrying or adjusting parameters depending on the situation.
    // [START_EXCLUDE]
    logger.err(err);
    res
      .status(500)
      .send(
        'Unable to successfully cast vote! Please check the application logs for more details.'
      )
      .end();
    // [END_EXCLUDE]
  }
  // [END cloud_sql_mysql_mysql_connection]

  res.status(200).send(`Successfully voted for ${team} at ${timestamp}`).end();
};
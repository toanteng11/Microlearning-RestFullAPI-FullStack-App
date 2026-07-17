const adminDatabase = db.getSiblingDB('admin');
const replicaSetName = 'rs0';

let currentStatus;

try {
  currentStatus = adminDatabase.runCommand({ replSetGetStatus: 1 });
} catch (error) {
  if (error.code !== 94 && error.codeName !== 'NotYetInitialized') throw error;
  currentStatus = null;
}

if (currentStatus === null || currentStatus.ok !== 1) {
  if (
    currentStatus !== null &&
    currentStatus.code !== 94 &&
    currentStatus.codeName !== 'NotYetInitialized'
  ) {
    throw new Error(`Unable to read replica-set status: ${currentStatus.codeName ?? 'unknown'}`);
  }

  const initiation = adminDatabase.runCommand({
    replSetInitiate: {
      _id: replicaSetName,
      members: [{ _id: 0, host: 'mongodb:27017', priority: 1 }],
    },
  });

  if (initiation.ok !== 1) {
    throw new Error(`Unable to initiate replica set: ${initiation.codeName ?? 'unknown'}`);
  }
} else if (currentStatus.set !== replicaSetName) {
  throw new Error(`Unexpected replica set: ${currentStatus.set ?? 'unknown'}`);
}

for (let attempt = 1; attempt <= 60; attempt += 1) {
  const hello = adminDatabase.runCommand({ hello: 1 });

  if (hello.ok === 1 && hello.isWritablePrimary === true && hello.setName === replicaSetName) {
    print(JSON.stringify({ event: 'mongodb.replica-set.ready', setName: hello.setName }));
    quit(0);
  }

  sleep(1000);
}

throw new Error('MongoDB replica set did not elect a writable primary within 60 seconds');

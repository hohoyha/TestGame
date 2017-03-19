mongodb
 create database:
    use myGame
 create collection
    db.createCollection("account");
    db.createCollection("progress");

add document
    db.account.insert({username:"bob",password:"pass"});
    db.account.insert({username:"bob2",password:"pass2"});
    db.progress.insert({username:"bob",level:123}); // 나중에

read document
    db.<COLLECTION>.find(<MUST MATCH>);
    db.progress.find({username:"bob"});


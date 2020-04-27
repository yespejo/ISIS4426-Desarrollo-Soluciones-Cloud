CREATE DATABASE smarttools;

USE smarttools;

CREATE TABLE users(
     id INT(11) NOT NULL,
     username VARCHAR(24) NOT NULL,
     name VARCHAR(24) NOT NULL,
     lastname VARCHAR(24) NOT NULL,
     email VARCHAR(320) NOT NULL, 
     password VARCHAR(60) NOT NULL
);

ALTER TABLE users 
   ADD PRIMARY KEY (id);

ALTER TABLE users
   MODIFY id INT (11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

DESCRIBE users; 


CREATE TABLE contest (
     id INT(11) NOT NULL,
     name VARCHAR(300) NOT NULL,
     image TEXT,
     url VARCHAR(300) NOT NULL,
     startdate timestamp NULL,
     enddate timestamp NULL,
     currentdate timestamp NOT NULL DEFAULT current_timestamp,
     description TEXT,
     user_id INT(11), 
     CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE contest 
   ADD PRIMARY KEY(id);
ALTER TABLE contest
   MODIFY id INT (11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

DESCRIBE contest; 

CREATE TABLE videos (
  id INT(11) NOT NULL,
  status VARCHAR(45) NULL,
  creationdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message TEXT NOT NULL,
  original_video TEXT,
  converted_video TEXT NULL,
  contest_id INT(11) NOT NULL,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  CONSTRAINT fk_contest FOREIGN KEY (contest_id) REFERENCES contest(id)
);

ALTER TABLE videos 
   ADD PRIMARY KEY(id);
ALTER TABLE videos
   MODIFY id INT (11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

DESCRIBE videos; 

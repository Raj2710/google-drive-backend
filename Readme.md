Welcome to the Backend developement of GDrive.
This project mainly consists of all login based routes and Storing files in aws s3 buket

http://server-name/user/register - for registering a user
http://server-name/user/confirm/:token - for Account activation
http://server-name/user/login - for login which will send the token
http://server-name/user/forgot-password - in case of forgot password this will help  
http://server-name/user/reset - to get the new password and update in DB


http://server-name/files/:token - to get all files of a specified person
http://server-name/upload/:token - to upload a single file to s3 bucket

Success operation will give response as
message:"Some Messsage"
instructoion"Some instruction" 
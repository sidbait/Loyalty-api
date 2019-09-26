module.exports.registerValidate = (number, email, firstName, lastName, facebook_id, google_id) => {
  let flag = true;
  let message = '';
  if (number !== '') {
    let matchedRegex = new RegExp('^[0-9]{9,15}$');
    let match = matchedRegex.test(number);
    flag = match;
    if (!match) {
      message = 'Mobile not correct : ' + number;
    }
  }
  if (email !== '') {
    let matchedRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,50}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
    let match = matchedRegex.test(email);
    if (!match) {
      message = 'Email Id not correct : ' + email;
    } 
  }
  if (firstName !== '') {
    let matchedRegex = new RegExp("^[a-zA-Z ]{1,50}$");
    let match = matchedRegex.test(firstName);
    if (!match) {
      message = 'First Name Id not correct : ' + firstName;
    } 
  }
  if (lastName !== '') {
    let matchedRegex = new RegExp("^[a-zA-Z ]{1,50}$");
    let match = matchedRegex.test(lastName);
    if (!match) {
      message = 'Last Name Id not correct : ' + lastName;
    } 
  }

  return {flag, message};
};
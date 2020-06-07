const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const debug         = require('debug')('server');
const express       = require('express');
const File          = require('fs');
const Multiparty    = require('multiparty');
const morgan        = require('morgan');
const Path          = require('path');
const Promise       = require('bluebird');


// An Express server we use to test the browser.
const server = express();

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(bodyParser.text());
server.use(cookieParser());
server.use(function(req, res, next) {
  const contentType = req.headers['content-type'];
  if (req.method === 'POST' && contentType && contentType.search('multipart/') === 0) {

    const form = new Multiparty.Form();
    form.parse(req, function(error, fields, files) {
      req.files = files;
      next(error);
    });

  } else
    next();
});

// Even tests need good logs
if (debug.enabled)
  server.use(morgan('dev', { stream: { write: debug } }));


// Use this for static responses.  First argument is the path, the remaining
// arguments are used with res.send, so can be static HTML, status code, etc.
server.static = function(path, output, options) {
  const status = (options && options.status) || 200;
  server.get(path, function(req, res) {
    res.status(status).send(output);
  });
};

// Use this for redirect responses.  First argument is the path, the remaining
// arguments are used with res.redirct, so can be URL and status code.
server.redirect = function(path, location, options) {
  const status = (options && options.status) || 302;
  server.get(path, function(req, res) {
    res.redirect(status, location);
  });
};


server.static('/', ` <html> <body> <form action="/forms/submit" method="post"> <label>Name <input type="text" name="name" id="field-name" /></label> <label for="field-email">Email</label> <input type="text" name="email" id="field-email"></label> <textarea name="likes" id="field-likes">Warm brains</textarea> <input type="password" name="password" id="field-password"> <input type="badtype" name="invalidtype" id="field-invalidtype"> <input type="text" name="email2" id="field-email2"> <input type="text" name="email3" id="field-email3"> <input type="text" name="disabled" disabled> <input type="text" name="readonly" readonly> <input type="text" name="empty_text" id="empty-text"> <label>Hungry</label> <label>You bet<input type="checkbox" name="hungry[]" value="you bet" id="field-hungry"></label> <label>Certainly<input type="checkbox" name="hungry[]" value="certainly" id="field-hungry-certainly"></label> <label for="field-brains">Brains?</label> <input type="checkbox" name="brains" value="yes" id="field-brains"> <input type="checkbox" name="green" id="field-green" value="Super green!" checked="checked"> <input type="checkbox" name="check" id="field-check" value="Huh?" checked="checked"> <input type="checkbox" name="uncheck" id="field-uncheck" value="Yeah!"> <input type="checkbox" name="empty_checkbox" id="empty-checkbox" checked="checked"> <label>Looks <select name="looks" id="field-looks"> <option value="blood" label="Bloody"></option> <option value="clean" label="Clean"></option> <option value=""      label="Choose one"></option> </select> </label> <label>Scary <input name="scary" type="radio" value="yes" id="field-scary"></label> <label>Not scary <input name="scary" type="radio" value="no" id="field-notscary" checked="checked"></label> <select name="state" id="field-state"> <option>alive</option> <option>dead</option> <option>neither</option> </select> <span>First address</span> <label for='address1_street'>Street</label> <input type="text" name="addresses[][street]" value="" id="address1_street"> <label for='address1_city'>City</label> <input type="text" name="addresses[][city]" value="" id="address1_city"> <span>Second address</span> <label for='address2_street'>Street</label> <input type="text" name="addresses[][street]" value="" id="address2_street"> <label for='address2_city'>City</label> <input type="text" name="addresses[][city]" value="" id="address2_city"> <select name="kills" id="field-kills"> <option>Five</option> <option>Seventeen</option> <option id="option-killed-thousands">Thousands</option> </select> <select name="unselected_state" id="field-unselected-state"> <option>alive</option> <option>dead</option> </select> <select name="hobbies[]" id="field-hobbies" multiple="multiple"> <option>Eat Brains</option> <option id="hobbies-messy">Make Messy</option> <option>Sleep</option> </select> <select name="months" id="field-months"> <option value=""></option> <option value="jan_2011"> Jan 2011 </option> <option value="feb_2011"> Feb 2011 </option> <option value="mar_2011"> Mar 2011 </option> </select> <select name="onfocus-selector" id="onfocus-selector"> <option value="value1" selected>value1</option> <option value="value2">value2</option> </select> <input type="unknown" name="unknown" value="yes"> <input type="reset" value="Reset"> <input type="submit" name="button" value="Submit"> <input type="image" name="image" id="image_submit" value="Image Submit"> <input type="image" name="image" id="image_no_value_submit"> <button name="button" value="hit-me">Hit Me</button> <input type="checkbox" id="field-prevent-check"> <input type="radio" id="field-prevent-radio"> <input type="radio" name="radio_reused_name" id="field-radio-first-form" /> </form> <div id="formless_inputs"> <label>Hunter <input type="text" name="hunter_name" id="hunter-name"></label> <textarea name="hunter_hobbies">Killing zombies.</textarea> <input type="password" name="hunter_password" id="hunter-password"> <input type="badtype" name="hunter_invalidtype" id="hunter-invalidtype" /> <label>Weapons</label> <label>Chainsaw<input type="checkbox" name="hunter_weapon[]" value="chainsaw"></label> <label>Shotgun<input type="checkbox" name="hunter_weapon[]" value="shotgun"></label> <label>Type <select name="hunter_type"> <option value="regular" label="Regular"></option> <option value="evil" label="Evil"></option> <option value="tiny" label="tiny"></option> </select> </label> <label>Powerglove <input name="hunter_powerglove" type="radio" value="glove"></label> <label>No powerglove <input name="hunter_powerglove" type="radio" value="noglove" checked="checked"></label> </div> <form> <input type="radio" name="radio_reused_name" id="field-radio-second-form" checked="checked" /> </form> </body> </html>`);

server.get('/scripts/jquery.js', function(req, res) {
  res.redirect('/scripts/jquery-2.0.3.js');
});

server.get('/scripts/require.js', function(req, res) {
  const file    = Path.resolve('node_modules/requirejs/require.js');
  const script  = File.readFileSync(file);
  res.send(script);
});

server.get('/scripts/*', function(req, res) {
  const script = File.readFileSync(Path.join(__dirname, '/../scripts/', req.params[0]));
  res.send(script);
});


const serverPromise = new Promise(function(resolve, reject) {
  server.listen(3003, resolve);
  server.on('error', reject);
});

server.ready = function(callback) {
  if (callback)
    serverPromise.done(callback);
  else
    return serverPromise;
};


module.exports = server;

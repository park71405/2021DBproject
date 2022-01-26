//모듈 추출
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var fs = require('fs');
var multipart = require('connect-multiparty');

//서버 생성
var client = mysql.createConnection({
  user: 'root',
  password: '6342',
  database: 'shopdb'
});
var app = express();

//서버 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multipart({uploadDir: __dirname + '/public/images'}));

//라우트 수행

app.get('/', function(request,response){
    client.query('SELECT * FROM top', function(error, results){
        response.render('cus_main', {
          data: results
        });
    });
});

app.get('/cart/:id', function(request, response){
  var pr = request.params.id; //상품 아이디
  var kind = pr.substring(0,1);
  var cl = request.cookies.cus_login; //고객 아이디

  //고객이 로그인되어 있지 않은 경우
  if(!cl){
    response.redirect('/cus');
  }
  else{
    client.query('select * from cart where client_id=? and product_id=?', [cl, pr],function(error, data){
      var s = [];
      for(var re of data){
        s.push(re.cart_id);
      }
      var cart_id = s[0];
      //카트에 동일 상품이 없음
      if(!cart_id){
        if(kind == 't'){  //상품이 상의일 경우
          client.query('select * from top where id=?',[pr],function(error, data2){
            var ss1 = [];
            for(var rw3 of data2){
                ss1.push(rw3.name);
                ss1.push(rw3.price);
                ss1.push(rw3.image);
            }
            var p_name = ss1[0];
            var p_price = ss1[1];
            var p_image = ss1[2];
            client.query('insert into cart (client_id, product_id, amount, product_name, product_price, product_image) values (?,?,?,?,?,?)',[cl, pr, 1, p_name, p_price, p_image], function(){
              response.redirect('/');
            });
          });
        }
        else if(kind == 'b'){ //상품이 하의일 경우
          client.query('select * from bottom where id=?',[pr],function(error, data2){
            var ss1 = [];
            for(var rw3 of data2){
                ss1.push(rw3.name);
                ss1.push(rw3.price);
                ss1.push(rw3.image);
            }
            var p_name = ss1[0];
            var p_price = ss1[1];
            var p_image = ss1[2];
            client.query('insert into cart (client_id, product_id, amount, product_name, product_price, product_image) values (?,?,?,?,?,?)',[cl, pr, 1, p_name, p_price, p_image], function(){
              response.redirect('/');
            });
          });
        }
        else if(kind == 'a'){   //상품이 악세서리일 경우
          client.query('select * from acce where id=?',[pr],function(error, data2){
            var ss1 = [];
            for(var rw3 of data2){
                ss1.push(rw3.name);
                ss1.push(rw3.price);
                ss1.push(rw3.image);
            }
            var p_name = ss1[0];
            var p_price = ss1[1];
            var p_image = ss1[2];
            client.query('insert into cart (client_id, product_id, amount, product_name, product_price, product_image) values (?,?,?,?,?,?)',[cl, pr, 1, p_name, p_price, p_image], function(){
              response.redirect('/');
            });
          });
        }
      }
      else{ //카트에 동일 상품이 존재
        var s1 = [];
        for(var re1 of data){
          s1.push(re1.amount);
        }
        var amount = s1[0] + 1;
        client.query('update cart set amount=? where cart_id=?', [amount, cart_id],function(){
          response.redirect('/');
        });
      }
    });
  }
});

//장바구니
app.get('/cart', function(request, response){
  var cl = request.cookies.cus_login;

  if(!cl){
    response.redirect('/cus');
  }
  else{
    client.query('SELECT * FROM cart where client_id=?', [cl], function(error, results){
      response.render('cart', {
        data: results
      });
    });
  }
});

app.get('/cart_delete/:cart_id', function(request, response){
  client.query('DELETE FROM cart WHERE cart_id=?',[request.params.cart_id], function(){
    response.redirect('/cart');
  });
});

//장바구니 상품 구매
app.get('/buy', function(request, response){
  client.query('select * from cart', function(error, results){
    results.forEach(function(item, index){
      var p_id = item.product_id;
      var amount = item.amount;
      var kind = p_id.substring(0,1);

      if(kind == 't'){
        client.query('select * from top where id=?', [p_id],function(error, data){
          var s = [];
          for(var rr of data){
            s.push(rr.count);
          }
          var count = s[0] - amount;
          client.query('update top set count=? where id=?',[count, p_id]);
        });
      }
      else if(kind == 'b'){
        client.query('select * from bottom where id=?', [p_id],function(error, data){
          var s = [];
          for(var rr of data){
            s.push(rr.count);
          }
          var count = s[0] - amount;
          client.query('update bottom set count=? where id=?',[count, p_id]);
        });
      }
      else if(kind == 'a'){
        client.query('select * from acce where id=?', [p_id],function(error, data){
          var s = [];
          for(var rr of data){
            s.push(rr.count);
          }
          var count = s[0] - amount;
          client.query('update acce set count=? where id=?',[count, p_id]);
        });
      }

      client.query('delete from cart where cart_id=?', [item.cart_id]);
    });
    response.redirect('/');
  });
});

//고객 하의 페이지
app.get('/cus_bottom', function(request, response){
  client.query('SELECT * FROM bottom', function(error, results){
    response.render('cus_bottom', {
      data: results
    });
  });
});

//고객 악세서리 페이지
app.get('/cus_acce', function(request, response){    client.query('SELECT * FROM acce', function(error, results){
    response.render('cus_acce',{
      data: results
    });
  });
});

//고객 로그인
app.get('/cus', function(request, response){
  if(request.cookies.cus_login){
    response.redirect('/');
  }
  else{
    response.redirect('/cus_login');
  }
})

app.get('/cus_login', function(request, response){
  response.render('cus_login',{
    data: toString()
  });
});

app.post('/cus_login', function(request, response){
  var login = request.body.login;
  var password = request.body.password;

  client.query('select id from client where id=?', login, function(error, data){
    var s = [];
    for(var re of data){
      s.push(re.id);
    }
    if(s[0] == login){
      client.query('select password from client where password=?', password, function(error1, data1){
        var p = [];
        for(var re1 of data1){
          p.push(re1.password);
        }
        if(p[0] == password){
          console.log('고객 로그인 성공');
          response.cookie('cus_login', login);
          response.redirect('/');
        }else{
          console.log('고객 로그인 실패');
          response.redirect('/cus_login');
        }
      });
    }else{
      console.log('고객 로그인 실패');
      response.redirect('/cus_login');
    }
  });
});

//고객 로그아웃
app.get('/logout', function(request, response){
  if(request.cookies.cus_login){
    response.clearCookie('cus_login');
    response.redirect('/');
  }else{
    response.redirect('/');
  }
});

//고객 회원가입
app.get('/join', function(request, response){
  response.render('cus_join',{

  });
});

app.post('/join', function(request,response){
  var body = request.body;

  client.query('INSERT INTO client (id, password, name, phone, address) VALUES (?,?,?,?,?)',[body.id, body.password, body.name, body.phone, body.address], function(){
    response.redirect('/');
  });
});

//고객 마이페이지
app.get('/cus_mypage', function(request,response){
  var cus_id = request.cookies.cus_login;
  if(cus_id){
    client.query('SELECT * FROM client WHERE id=?', [cus_id], function(error, results){
      response.render('cus_mypage',{
        data:results
      });
    });
  }else{
    response.redirect('/');
  }
});

//고객용 정보 수정
app.get('/cus_mypage_edit/:id', function(request, response){
  client.query('SELECT * FROM client WHERE id=?',[request.params.id], function(error, result){
    response.render('cus_mypage_edit',{
      data: result[0]
    });
  });
});

app.post('/cus_mypage_edit/:id', function(request, response){
  var body = request.body;

  client.query('UPDATE client SET password=?, name=?, phone=?, address=? WHERE id=?',[ body.password, body.name, body.phone, body.address, request.params.id], function(){
    response.redirect('/cus_mypage');
  });
});

//직원용 페이지
app.get('/wor', function(request, response){
  if(request.cookies.wor_login){
    response.redirect('/wor_main');
  }
  else{
    response.redirect('/wor_login');
  }
})

//직원 로그인
app.get('/wor_login', function(request, response){
  response.render('wor_login',{
    data: toString()
  });
});

app.post('/wor_login', function(request, response){
  var login = request.body.login;
  var password = request.body.password;

  client.query('select id from worker where id=?', login, function(error, data){
    var s = [];
    for(var re of data){
      s.push(re.id);
    }
    if(s[0] == login){
      client.query('select password from worker where password=?', password, function(error1, data1){
        var p = [];
        for(var re1 of data1){
          p.push(re1.password);
        }
        if(p[0] == password){
          console.log('직원 로그인 성공');
          response.cookie('wor_login', true);
          response.redirect('/wor_main');
        }else{
          console.log('직원 로그인 실패');
          response.redirect('/wor_login');
        }
      });
    }else{
      console.log('직원 로그인 실패');
      response.redirect('/wor_login');
    }
  });
});

//직원 로그아웃
app.get('/wor_logout', function(request, response){
  if(request.cookies.wor_login){
    response.clearCookie('wor_login');
    response.redirect('/wor');
    console.log('직원이 로그아웃 하였습니다.');
  }else{
    response.redirect('/wor');
  }
});

//직원 메인페이(상의)
app.get('/wor_main', function(request,response){
    client.query('SELECT * FROM top', function(error, results){
      response.render('wor_main',{
        data: results
      });
    });
});

//직원용 상의 삭제
app.get('/wor_delete_top/:no', function(request, response){
  client.query('DELETE FROM top WHERE no=?',[request.params.no], function(){
    response.redirect('/wor_main');
  });
});

app.get('/wor_insert_top', function(request, response){
  response.render('wor_insert_top',{

  });
});

app.post('/wor_insert_top', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO top (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_main');
    });
  });
});

app.get('/wor_edit_top/:no', function(request, response){
  client.query('SELECT * FROM top WHERE no=?',[request.params.no], function(error, result){
    response.render('wor_edit_top', {
      data: result[0]
    });
  });
});

app.post('/wor_edit_top/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE top SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_main');
    });
  });
});

//직원용(하의)
app.get('/wor_bottom', function(request,response){
  client.query('SELECT * FROM bottom', function(error, results){
    response.render('wor_bottom',{
      data: results
    });
  });
});

app.get('/wor_delete_bottom/:no', function(request, response){
  client.query('DELETE FROM bottom WHERE no=?',[request.params.no], function(){
    response.redirect('/wor_bottom');
  });
});

app.get('/wor_insert_bottom', function(request, response){
  response.render('wor_insert_bottom',{

  });
});

app.post('/wor_insert_bottom', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO bottom (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_bottom');
    });
  });
});

app.get('/wor_edit_bottom/:no', function(request, response){
  client.query('SELECT * FROM bottom WHERE no=?',[request.params.no], function(error, result){
    response.render('wor_edit_bottom',{
      data: result[0]
    });
  });
});

app.post('/wor_edit_bottom/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE bottom SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_bottom');
    });
  });
});

//직원용 (악세서리)
app.get('/wor_acce', function(request,response){
  client.query('SELECT * FROM acce', function(error, results){
    response.render('wor_acce',{
      data: results
    });
  });
});

app.get('/wor_delete_acce/:no', function(request, response){
  client.query('DELETE FROM acce WHERE no=?',[request.params.no], function(){
    response.redirect('/wor_acce');
  });
});

app.get('/wor_insert_acce', function(request, response){
  response.render('wor_insert_acce',{

  });
});

app.post('/wor_insert_acce', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO acce (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_acce');
    });
  });
});

app.get('/wor_edit_acce/:no', function(request, response){
  client.query('SELECT * FROM acce WHERE no=?',[request.params.no], function(error, result){
    response.render('wor_edit_acce',{
      data: result[0]
    });
  });
});

app.post('/wor_edit_acce/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE acce SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/wor_acce');
    });
  });
});

//매니저용 페이지
app.get('/mana', function(request, response){
  if(request.cookies.mana_login){
    response.redirect('/mana_main');
  }
  else{
    response.redirect('/mana_login');
  }
})

app.get('/mana_login', function(request, response){
  response.render('mana_login',{
    data: toString()
  });
});

app.post('/mana_login', function(request, response){
  var login = request.body.login;
  var password = request.body.password;

  client.query('select id from manager where id=?', login, function(error, data){
    var s = [];
    for(var re of data){
      s.push(re.id);
    }
    if(s[0] == login){
      client.query('select password from manager where password=?', password, function(error1, data1){
        var p = [];
        for(var re1 of data1){
          p.push(re1.password);
        }
        if(p[0] == password){
          console.log('매니저 로그인 성공');
          response.cookie('mana_login', true);
          response.redirect('/mana_main');
        }else{
          console.log('매니저 로그인 실패');
          response.redirect('/mana_login');
        }
      });
    }else{
      console.log('매니저 로그인 실패');
      response.redirect('/mana_login');
    }
  });
});

//매니저 로그이아웃
app.get('/mana_logout', function(request, response){
  if(request.cookies.mana_login){
    response.clearCookie('mana_login');
    response.redirect('/mana');
    console.log('매니저가 로그아웃 하였습니다.');
  }else{
    response.redirect('/mana');
  }
});

//매니저용 (상의)
app.get('/mana_main', function(request,response){
  client.query('SELECT * FROM top', function(error, results){
    response.render('mana_main',{
      data: results
    });
  });
});

app.get('/mana_delete_top/:no', function(request, response){
  client.query('DELETE FROM top WHERE no=?',[request.params.no], function(){
    response.redirect('/mana_main');
  });
});

app.get('/mana_insert_top', function(request, response){
  response.render('mana_insert_top',{

  });
});

app.post('/mana_insert_top', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO top (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_main');
    });
  });
});

app.get('/mana_edit_top/:no', function(request, response){
  client.query('SELECT * FROM top WHERE no=?',[request.params.no], function(error, result){
    response.render('mana_edit_top',{
      data: result[0]
    });
  });
});

app.post('/mana_edit_top/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE top SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_main');
    });
  });
});

//매니저용(하의)
app.get('/mana_bottom', function(request,response){
  client.query('SELECT * FROM bottom', function(error, results){
    response.render('mana_bottom',{
      data: results
    });
  });
});

app.get('/mana_delete_bottom/:no', function(request, response){
  client.query('DELETE FROM bottom WHERE no=?',[request.params.no], function(){
    response.redirect('/mana_bottom');
  });
});

app.get('/mana_insert_bottom', function(request, response){
  response.render('mana_insert_bottom',{

  });
});

app.post('/mana_insert_bottom', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO bottom (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_bottom');
    });
  });
});

app.get('/mana_edit_bottom/:no', function(request, response){
  client.query('SELECT * FROM bottom WHERE no=?',[request.params.no], function(error, result){
    response.render('mana_edit_bottom',{
      data: result[0]
    });
  });
});

app.post('/mana_edit_bottom/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE bottom SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_bottom');
    });
  });
});

//직원용 (악세서리)
app.get('/mana_acce', function(request,response){
  client.query('SELECT * FROM acce', function(error, results){
    response.render('mana_acce',{
      data: results
    });
  });
});

app.get('/mana_delete_acce/:no', function(request, response){
  client.query('DELETE FROM acce WHERE no=?',[request.params.no], function(){
    response.redirect('/mana_acce');
  });
});

app.get('/mana_insert_acce', function(request, response){
  response.render('mana_insert_acce',{

  });
});

app.post('/mana_insert_acce', function(request,response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + '/public/images/' + name;

  client.query('INSERT INTO acce (id,name,count,discount,kind,price,image) VALUES (?,?,?,?,?,?,?)',[body.id,body.name, body.count, body.discount, body.kind, body.price, name], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_acce');
    });
  });
});

app.get('/mana_edit_acce/:no', function(request, response){
  client.query('SELECT * FROM acce WHERE no=?',[request.params.no], function(error, result){
    response.render('mana_edit_acce',{
      data: result[0]
    });
  });
});

app.post('/mana_edit_acce/:no', function(request, response){
  var body = request.body;
  var imageFile = request.files.image;
  var name = imageFile.name;
  var path = imageFile.path;
  var outputPath = __dirname + "/public/images/" + name;

  client.query('UPDATE acce SET name=?, count=?, discount=?, kind=?, price=?, image=? WHERE no=?',[body.name, body.count, body.discount, body.kind, body.price, name, request.params.no], function(){
    fs.rename(path, outputPath, function(error){
      response.redirect('/mana_acce');
    });
  });
});

//매니저 고객 조회
app.get('/mana_cus', function(request,response){
  client.query('SELECT * FROM client', function(error, results){
    response.render('mana_cus',{
      data: results
    });
  });
});

//매니저 고객 삭제
app.get('/mana_delete_cus/:id', function(request, response){
  client.query('DELETE FROM client WHERE id=?',[request.params.id], function(){
    response.redirect('/mana_cus');
  });
});

//매니저 직원 조회
app.get('/mana_wor', function(request,response){
  client.query('SELECT * FROM worker', function(error, results){
    response.render('mana_wor',{
      data: results
    });
  });
});

//매니저 직원 삭제
app.get('/mana_delete_wor/:id', function(request, response){
  client.query('DELETE FROM worker WHERE id=?',[request.params.id], function(){
    response.redirect('/mana_wor');
  });
});

//매니저 직원 추가
app.get('/mana_insert_wor', function(request, response){
  response.render('mana_insert_wor',{

  });
});

app.post('/mana_insert_wor', function(request,response){
  var body = request.body;

  client.query('INSERT INTO worker (id,password,name,phone,paycheck) VALUES (?,?,?,?,?)',[body.id, body.password, body.name, body.phone, body.paycheck], function(){
    response.redirect('/mana_wor');
  });
});

//매니저 직원 수정
app.get('/mana_edit_wor/:id', function(request, response){
  client.query('SELECT * FROM worker WHERE id=?',[request.params.id], function(error, result){
    response.render('mana_edit_wor',{
      data: result[0]
    });
  });
});

app.post('/mana_edit_wor/:id', function(request, response){
  var body = request.body;

  client.query('UPDATE worker SET password=?, name=?, phone=?, paycheck=? WHERE id=?',[body.password, body.name, body.phone, body.paycheck, request.params.id], function(){
    response.redirect('/mana_wor');
  });
});

// 에러 처리
app.use(function(err, req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render('error',{
    message: err.message,
    error: {}
  });
});

module.exports = app;

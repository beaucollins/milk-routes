

(function($){
  
  /*
  Route data model to contain the route name and coordinates
  */
  
  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

  function isPointInPoly(poly, pt){
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
      ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
  }
  
  
  var Route = function(name, poly){
    this.name = name;
    this.poly = poly;
        
    this.containsLatLng = function(latLng){
      var poly = this.poly;
      var pt = {x:latLng.lng(), y:latLng.lat()};
      return isPointInPoly(poly, pt);
    };
    
    this.getFormData = function(data){
      console.log("Get form data", data);
      // first figure out which mapping to use:
      var form = this.getFieldMapping();
      var map = form.fields;
      var mapped = {};
      for(field in map){
        mapped[(map[field] ? map[field] : field)] = (data[field] || '');
      }
      console.log(mapped);
      return {
        url: form.url,
        fields: mapped
      };
    }
    
    this.getFieldMapping = function(){
      return Route.forms.crm;
      if (this.name.match(/Company Route/i)) {
        return Route.forms.ross;
      }else if (this.name.match(/Route [\d]+/i)) {
        return Route.forms.crm;
      };
    }
  }
    
  Route.forms = {
    'crm' : {
      url: 'http://smithbroshome.rossusa.com/Forms/customerinfo.aspx',
      fields: {
        'firstname'                     : 'ctl00$cphLeft_Center$ctl00$txtFirstName',
        'lastname'                      : 'ctl00$cphLeft_Center$ctl00$txtLastName',
        'address1_line1'                : 'ctl00$cphLeft_Center$ctl00$txtStreetAddress',
        'new_address_unit'              : '',
        'address1_city'                 : 'ctl00$cphLeft_Center$ctl00$txtCity',
        'address1_postalcode'           : 'ctl00$cphLeft_Center$ctl00$txtZipCode',
        'emailaddress1'                 : 'ctl00$cphLeft_Center$ctl00$txtEmail',
        'telephone1'                    : 'ctl00$cphLeft_Center$ctl00$txtPhone',
        'telephone2'                    : 'ctl00$cphLeft_Center$ctl00$txtCellPhone',
        'state'                         : 'ctl00$cphLeft_Center$ctl00$ddlState'
        // 'preferredcontactmethodcode'    : '',
        // 'new_promocode'                 : '',
        // 'new_howdidyouhearaboutus'      : '',
        // 'Web2CRMAnswer'                 : '',
        // 'formID'                        : '',
        // '_thankyou_'                    : ''
      }
    },
    'ross' : {
      url: 'http://web2crm.crminnovation.com/HostedForm/default.aspx?ID=ab54b4e5-1239-40e3-9c95-c7cdfa0d3e00',
      fields: {
        'firstname'                     : '',
        'lastname'                      : '',
        'address1_line1'                : '',
        'new_address_unit'              : '',
        'address1_city'                 : '',
        'address1_postalcode'           : '',
        'state'                         : '',
        'emailaddress1'                 : '',
        'telephone1'                    : '',
        'telephone2'                    : '',
        'preferredcontactmethodcode'    : '',
        'new_promocode'                 : '',
        'new_howdidyouhearaboutus'      : '',
        'Web2CRMAnswer'                 : '',
        'formID'                        : '',
        '_thankyou_'                    : ''
      }
    }
  }
  
  Route.routes = [];
  
  Route.build = function(placemark){
    var $placemark = $(placemark);
    var name = $placemark.find('name').text();
    // var coordinates;
    var coordinate_text = $placemark.find('coordinates').text().trim();
    var coordinates = coordinate_text.split(" ");
    var path = [];
    for (var i = coordinates.length - 1; i >= 0; i--){
      var coordinate = coordinates[i].split(',');
      var latlng = {x:parseFloat(coordinate[0]),y:parseFloat(coordinate[1])};
      path.push(latlng);
    };
    
    var r = new Route(name, path);
    Route.routes.push(r);
    return r;
        
  }
  
  Route.routeForLatLng = function(latLng){
    for (var i = Route.routes.length - 1; i >= 0; i--){
      var route = Route.routes[i];
      if (route.containsLatLng(latLng)) {
        return route;
      };
    };
    return;
  }
  
  var geocoder = new google.maps.Geocoder;
  
  Route.routeForAddress = function(address, success, failure){
    geocoder.geocode({ address: address }, function(results, status){
      if (status == google.maps.GeocoderStatus.OK) {
        // find the routes that matches the first result
        var latLng = results[0].geometry.location;
        if (route = Route.routeForLatLng(latLng)) {
          success(route);
        }else{
          failure();
        }
      }else{
        if(failure) failure(status);
      }
    })
    
  }  
  
  var ready = false;
  
  $.ajax({
    type:'GET',
    url:'js/sbf_jobber_routes.kml',
    success:function(data, textStatus, jqXHR){
      
      $(data).find("Placemark").each(function(){
        var route = Route.build(this);
      });
      
      ready = true;
      
    },
    error:function(jqXHR, textStatus, errorThrown){
      throw("Could not load KML");
    }   
  });
    
  
  $(document).ready(function(){
    $('#form1').submit(function(e){
      e.preventDefault();
      var $form = $(this);
      var address = $form.find('[name=address1_line1]').val() + " " + $form.find('[name=address1_city]').val() + " WA";
      Route.routeForAddress(address,
        function(route){
          var submitted = $form.serializeArray();
          var data = {'state':'WA'};
          console.log('submitted', submitted);
          $.each(submitted, function(index, field){
            console.log(arguments, this);
            data[field.name] = field.value;
          });
          console.log('data', data);
          var formData = route.getFormData(data);
          var f = $('<form method="POST" action="'+ formData.url +'"></form>')
          $('body').append(f);
          for(field in formData.fields){
            f.append('<input type="hidden" name="' + field + '" value="' + formData.fields[field].value + '" >')
          }
          f.append('<input type="submit">');
        },
        function(error){
          console.log(error);
        }
      );
      
      
    })
  });
    
  
})(jQuery);


(function($){
  
  /*
  Route data model to contain the route name and coordinates
  */
  
  var Route = function(name, poly, bounds){
    this.name = name;
    this.poly = poly;
    this.bounds = bounds;
    
    this.containsLatLng = function(latLng){
      var poly = this.poly;
      var pt = [latLng.lat(), latLng.lng()];
      if(!this.bounds.contains(latLng)){
        return false;
      }
      return isPointInPoly(pt, poly);
    };
  }
  
  Route.routes = [];
  
  Route.build = function(placemark){
    var $placemark = $(placemark);
    var name = $placemark.find('name').text();
    // var coordinates;
    var coordinate_text = $placemark.find('coordinates').text().trim();
    var coordinates = coordinate_text.split(" ");
    var path = [];
    var bounds = new google.maps.LatLngBounds();
    for (var i = coordinates.length - 1; i >= 0; i--){
      var coordinate = coordinates[i].split(',');
      var latlng = [parseFloat(coordinate[0]),parseFloat(coordinate[1])];
      bounds.extend(new google.maps.LagLng(laglng[0], latlng[1]));
      path.push(latlng);
    };
    
    var r = new Route(name, path, bounds);
    Route.routes.push(r);
    return r;
        
  }
  
  Route.routeForLatLng = function(latLng){
    for (var i = Route.routes.length - 1; i >= 0; i--){
      var route = Route.routes[i];
      console.log("Checking if route: ", route.name, " contains ", latLng);
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
  
    
  var crm_field_map = {};
  var ross_field_map = {};
  
  
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
      console.log(this);
      var address = $form.find('[name=address1_line1]').val() + " " + $form.find('[name=address1_city]') + " WA";
      
      Route.routeForAddress(address,
        function(route){
          console.log(route);
        },
        function(error){
          console.log(error);
        }
      );
      
      
    })
  });
  
})(jQuery);
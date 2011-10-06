var kml;

(function($){
  $.fn.toAddress = function(){
    return "6302 181st PL SW, Lynnwood, WA 98037";
  };
})(jQuery);

$(document).ready(function() {
  // var center = new google.maps.LatLng(47.58, -122.35);
  // var mapOptions = {
  //   zoom: 9,
  //   center: center,
  //   mapTypeId: google.maps.MapTypeId.ROADMAP
  // };
  // 
  // var map = new google.maps.Map(
  //     document.getElementById("map_canvas"),
  //     mapOptions);
  // 
  // var routesLayer = kml = new google.maps.KmlLayer(
  //   'http://www.smithbrothersfarms.com/js/sbf_jobber_routes.kml',
  //   {
  //     suppressInfoWindows: false,
  //     preserveViewport: true,
  //     map: map
  //   }
  // );

  // var marker = null;
  // var infowindow = null;

  $('#form1').submit(find_address);

  //////////////
  // Functions
  function find_address(e) {
    e.preventDefault();
    // console.log("find_address called");
    var address = $(this).toAddress();
    var point = { x: '', y: ''};
    var geocoder = new google.maps.Geocoder();

    var sw = new google.maps.LatLng(46.668, -123.289);
    var ne = new google.maps.LatLng(48.560, -121.460);
    var bounds = new google.maps.LatLngBounds(sw, ne);

    geocoder.geocode({
        address: address,
        bounds: bounds
      },
      function(data, status) {
        // console.log(data);
        if (data.length == 0) {
          geocodingFailed();
        } else {
          point.x = data[0].geometry.location.lng();
          point.y = data[0].geometry.location.lat();
          find_route(point);
        }
        // console.log(point);
      }
    );
    return false; // Stop click from submitting form.
  }
  
  function find_route(point) {
    $.ajax({
      type: "GET",
      url:  'js/sbf_jobber_routes.kml',
      dataType: "text",
      success: function(data) {
        var found = false;
        var kml = $.parseXML(data);
        $(kml).find('Placemark').each(function() {
        // $(data).find('Placemark').each(function() {
          // console.log(this);
          var coordinates_text = $(this).find('coordinates').text();
          var coordinates = coordinates_text.split(" ");
          var polygon = [];
          for (var i = 0; i < coordinates.length; i++) {
            var coordinate_data = coordinates[i].split(",");
            coordinate_data[0] = coordinate_data[0].replace(/[^\d-.]/, '');
            if (typeof(coordinate_data[0]) != "undefined" &&
                typeof(coordinate_data[1]) != "undefined") {
              polygon[i] = {x: parseFloat(coordinate_data[0]), y: parseFloat(coordinate_data[1])};
            }
          }
          // console.log(polygon);
          if (isPointInPoly(polygon, point)) {
            // console.log("We got one");
            // console.log($(this).find('name').text());
            // console.log($(this).find('description').contents());
            // console.log($(this).attr('id'));
            // dropMarker(point, this);
            var route_name = $(this).find('name').text();
            
            if (route_name.match(/Company Route/i)) {
              // GOTO ROSS
              // http://smithbroshome.rossusa.com/Forms/customerinfo.aspx
              return;
            }else if(route_name.match(/Route [\d]+/)){
              // GOTO CRM
              // http://web2crm.crminnovation.com/HostedForm/default.aspx?ID=ab54b4e5-1239-40e3-9c95-c7cdfa0d3e00
              
            }
            
            
            found = true;
            return false;
          }
        });
        if (!found) {
          // notInRoute();
          // NO ROUTE
          // POST TO SITE
        }
      }
    });
  }

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

  function isPointInPoly(poly, pt){
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
      ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
  }

  function geocodingFailed() {
    alert("Sorry, we cannot locate that address. Try entering just your zip code, or give us a call at 1-877-MILKMAN.");
  }

  function notInRoute() {
    alert("Sorry, that address does not appear to be on a delivery route. If you think you are in a Smith Brothers Farms delivery area, please give us a call at 1-877-MILKMAN.");
  }

  function dropMarker(point, placemark) {
    var position = new google.maps.LatLng(point.y, point.x);
    if (infowindow) {
      infowindow.close();
      infowindow = null;
    }
    if (marker) {
      marker.setMap(null);
      marker = null;
    }
    map.panTo(position);
    marker = new google.maps.Marker({
      position: position,
      // animation: google.maps.Animation.DROP,
      title: $(placemark).find('name').text()
    });
    marker.setMap(map);
    infowindow = new google.maps.InfoWindow({
      content: '<div style="font-weight: bold; font-size: medium; margin-bottom: 0;">' +
               $(placemark).find('name').text() +
               '</div><p>' +
               $(placemark).find('description').text() +
               '</p>'
    });
    infowindow.open(map, marker);
  }
});
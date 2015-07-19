function initialize() {
  var mapOptions = {
    zoom: 10 //Wy 10? Because it looks fucking awesome.
  };
  var map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);

  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);

      var image = 'marker.png';
      var infowindow = new google.maps.Marker({
        position: pos,
      map: map,
      icon: image
      });

      map.setCenter(pos);
    }, function() {
      handleNoGeolocation(true);
    });
  }

  var input = /** @type {HTMLInputElement} */(
      document.getElementById('pac-input'));

  var types = document.getElementById('type-selector');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  var infowindow = new google.maps.InfoWindow();
  var marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); 
    }
    marker.setIcon(/** @type {google.maps.Icon} */({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);




    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    infowindow.open(map, marker);
    window.placeID = place.name
    recalculateGlobalScore()


  });
  

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  function setupClickListener(id, types) {
    var radioButton = document.getElementById(id);
    google.maps.event.addDomListener(radioButton, 'click', function() {
      autocomplete.setTypes(types);
    });
  }

  setupClickListener('changetype-all', []);
  setupClickListener('changetype-address', ['address']);
  setupClickListener('changetype-establishment', ['establishment']);
  setupClickListener('changetype-geocode', ['geocode']);
}

google.maps.event.addDomListener(window, 'load', initialize);

//Voting


    var time = jQuery.parseJSON(
        jQuery.ajax({
            url: "http://currentmillis.com/api/millis-since-unix-epoch.php", 
            async: false,
            dataType: 'json'
    }).responseText
             );

    $(function(){
        setInterval(timeUpdateFunction, 200);
            });

    function timeUpdateFunction() {
        time=time+200;
            }

    var myDataRef = new Firebase('https://goodenoughroomv2.firebaseio.com/');
    var venue = "development";

    document.getElementById('up-arrow').onclick = function() {
        myDataRef.push({ 'vote': 1, 'time': time, 'venue': window.placeID});
            };

    document.getElementById('down-arrow').onclick = function() {
        myDataRef.push({ 'vote': 0, 'time': time, 'venue': window.placeID});
            };

    var votes = [0]
      , globalAverage = 0

    myDataRef
      .orderByChild('venue')
      .limitToLast(100)
      .on('child_added', addNewData)

    function addNewData(snapshot)  {
      var voteJSON = snapshot.val()
      votes.push(voteJSON)
      recalculateGlobalScore()
    }

    function recalculateGlobalScore() {
      var myVotes = votes.filter( function(a) { return a.venue === window.placeID } )
      , total = myVotes.reduce( function(sum, json) { return sum + json.vote }, 0 )
      , avg = total / myVotes.length
      , weightedAverage = (avg * 100)|0

      document.getElementById("room-opinion").innerHTML = weightedAverage
    }

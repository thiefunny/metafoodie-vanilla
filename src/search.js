const providers = ["facebook", "yelp", "zomato"]

let summary = 0;
let ratingsCount = 0;

function fetchResults(lat, lng, name, provider) {
    providers.forEach(function (provider) {
        $(`#${provider}_results td.name`).html("Loading...");
        $(`#${provider}_results td.rating`).html("Loading...");
    })

    summary = 0;
    ratingsCount = 0;

    const params = `lat=${lat}&lng=${lng}&name=${name}&provider=${provider}`;
    const apiUrl = `https://5ysytaegql.execute-api.eu-north-1.amazonaws.com/search/by_lat_lng_name?${params}`;

    $.get(apiUrl, function (results) {
        appendResults(JSON.parse(results));
    })
}

function appendResults(results) {
    const place = results.data[0];
    const provider = results.provider;
    const providerRowSelector = `#${provider}_results`;
    const $providerRow = $(providerRowSelector);

    if (place) {
        const rating = parseFloat(place.rating)
        $providerRow.find("td.rating").html(`${rating} (${place.rating_count})`);
        $providerRow.find("td.name").html(place.name);

        if (!isNaN(rating)) {
            ratingsCount += 1;
            summary += rating;
            const percentage = Math.round(((summary / ratingsCount) / 5) * 100)
            let textColor = "#ffffff";
            let backgroundColor;
            if (percentage > 85) {
                backgroundColor = "#24aa24"
            } else if (percentage > 70) {
                backgroundColor = "#ddee07"
                textColor = "#444444"
            } else if (percentage > 50) {
                backgroundColor = "#d49520"
            } else {
                backgroundColor = "red"
            }
            console.log("color", backgroundColor)
            $(".rating-summary").css({"backgroundColor": backgroundColor, "color": textColor});
            $(".rating-summary").html(percentage + "%");
        }
    } else {
    }
}

function fetchResultsForGooglePlace(place) {
    console.log("place", place)

    const foodPlaceTypes = ["bakery", "bar", "cafe", "meal_delivery", "meal_takeaway", "restaurant"]
    if (place.types.join().match(foodPlaceTypes.join("|")) == null) {
        $(".alert").removeClass("d-none");
    } else {
        $(".alert").addClass("d-none");
        const name = place.name;
        const location = place.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        place.rating_count = place.user_ratings_total;
        appendResults({data: [place], provider: "google"})

        providers.forEach(function (provider) {
            fetchResults(lat, lng, name, provider);
        })
    }
}

// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.
window.App.initAutocomplete = function () {
    let map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 52.2688369, lng: 20.9829954},
        zoom: 16,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false
    });

    let placesService = new google.maps.places.PlacesService(map);

    // Create the search box and link it to the UI element.
    let input = document.getElementById('pac-input');
    let searchBox = new google.maps.places.SearchBox(input);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    map.addListener('click', function (event) {
        if (event.placeId) {
            placesService.getDetails({placeId: event.placeId}, function (place, status) {
                fetchResultsForGooglePlace(place);
            });
        }
    });

    let markers = [];

    searchBox.addListener('places_changed', function () {
        let places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location.
        let bounds = new google.maps.LatLngBounds();
        let place = places[0];
        // places.forEach(function (place) {
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }
        // let icon = {
        //     url: place.icon,
        //     size: new google.maps.Size(71, 71),
        //     origin: new google.maps.Point(0, 0),
        //     anchor: new google.maps.Point(17, 34),
        //     scaledSize: new google.maps.Size(25, 25)
        // };

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
            map: map,
            // icon: icon,
            title: place.name,
            position: place.geometry.location
        }));

        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
        // });
        map.fitBounds(bounds);
        fetchResultsForGooglePlace(place)
    });
}

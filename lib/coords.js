export function splitCoords(s_, loc_) {
   var mem = s_;
   if (s_.indexOf("N ") == 0) { s_ = "N" + s_.substring(2); }
   if (s_.indexOf("S ") == 0) { s_ = "S" + s_.substring(2); }
   s_ = s_.replace(/"/g, '″');
   s_ = s_.replace(/'/g, '′');
   s_ = s_.replace(/′/g, '′');
   s_ = s_.replace(/′ /g, '′');
   s_ = s_.replace(/″ /g, '″');
   s_ = s_.replace(/° /g, '°');
   s_ = s_.replace(/E/g, ' E');
   s_ = s_.replace(/W/g, ' W');
   s_ = s_.replace(/,/g, ', ');
   s_ = s_.replace(/  /g, ' ');
   s_ = s_.replace(/  /g, ' ');
   s_ = s_.replace(/E /g, 'E');
   s_ = s_.replace(/W /g, 'W');
   s_ = s_.replace(/′ W$/g, '′W');
   s_ = s_.replace(/′ E$/g, '′E');
   s_ = s_.replace(/″ W$/g, '″W');
   s_ = s_.replace(/″ E$/g, '″E');
   s_ = s_.replace(/ ,/g, ',');

   var latlng = s_.split(' ');
   if (latlng.length !== 2) {
     //console.log(s_);
     console.log('Can not deal with ' + mem + ', ' + loc_ + '   (pos: splitCoords)');
   } else {
     latlng[0] = latlng[0].replace(/,/g, "");
     latlng[1] = latlng[1].replace(/,/g, "");
   }
   //return rs;

   let lat = latlng[0];
   let lng = latlng[1];
   return { lat, lng };
}

export function parseStringToDMS(s_) {
   let deg = -1;
   let min = -1;
   let sec = -1;
   let dir = 'noDir';

   s_ = s_.replace(/°/g, ' ');
   s_ = s_.replace(/′/g, ' ');
   s_ = s_.replace(/″/g, ' ');
   if (s_.indexOf('N') !== -1) { dir = 'N' }
   if (s_.indexOf('S') !== -1) { dir = 'S' }
   if (s_.indexOf('W') !== -1) { dir = 'W' }
   if (s_.indexOf('E') !== -1) { dir = 'E' }

   s_ = s_.replace(/S/, '');
   s_ = s_.replace(/N/, '');
   s_ = s_.replace(/W/, '');
   s_ = s_.replace(/E/, '');
   s_ = s_.trim();

   let dms = s_.split(' ');
   if (dms.length > 0) { deg = dms[0] }
   if (dms.length > 1) { min = dms[1] }
   if (dms.length > 2) { sec = dms[2] }

   return { deg, min, sec, dir };
}

export function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = parseInt(degrees) + parseInt(minutes)/60 + parseInt(seconds)/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}
let s=require("Storage");
s.erase("battery.i");
s.write("battery.i", [0,105,1,28,1,27,46,179,19,46,27,1,128,3,27,36,5,128,19,5,36,27,128,3,46,5,128,21,5,46,128,3,51,128,23,51,128,3,51,128,23,51,0,38,6,51,128,23,51,0,51,38,51,128,23,51,0,51,49,51,128,23,51,0,51,38,51,128,23,51,0,38,6,51,128,23,51,128,3,46,5,128,21,5,46,128,3,27,36,5,128,19,5,36,27,128,3,1,27,46,179,19,46,27,1,128,3], 0, 170);
console.log("glyph 0 done, written 107 of 170 bytes");
s.write("battery.i", [0,61,1,5,128,4,11,128,3,18,16,128,2,2,53,2,128,2,34,47,128,2,11,62,31,128,2,49,63,14,0,26,191,2,53,35,21,18,40,63,18,128,2,53,39,128,2,11,57,3,128,2,33,18,128,3,31,128,3,6,4,128,3], 107, 170);
console.log("glyph 1 done, written 170 of 170 bytes");
echo("Upload battery.i done");

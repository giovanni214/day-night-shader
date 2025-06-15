#version 100
precision mediump float;

#define PI 3.141592653589793

#define CIVIL_TWILIGHT 1.57079632679
#define NAUTICAL_TWILIGHT 1.67551608191
#define ASTRONOMICAL_TWILIGHT 1.78023583704
#define NIGHT 1.88495559217

uniform vec3 u_sun_dir;
uniform vec2 u_resolution;
uniform sampler2D u_map_day;
uniform sampler2D u_map_night;

vec2 reverseEquirectangular(vec2 pos) {
    float longitudePerPixel = 2.0 * PI / u_resolution.x;
    float latitudePerPixel = PI / u_resolution.y;
    float longitude = (pos.x - u_resolution.x * 0.5) * longitudePerPixel;
    float latitude = (pos.y - u_resolution.y * 0.5) * latitudePerPixel;
    return vec2(longitude,latitude);
}

vec4 drawLine(vec4 inColor, float angle, float lineAngle, float angularWidth) {
    float edge = smoothstep(0.0, angularWidth,  abs(angle - angularWidth*0.5 - lineAngle));
    return mix(inColor, vec4(1.0, 1.0, 1.0, 1.0), (1.0 - edge) * 0.12);
}

void main() {
    vec2 texCoord = gl_FragCoord.xy/u_resolution;
    vec4 mapColorDay = texture2D(u_map_day, texCoord);
    vec4 mapColorNight = texture2D(u_map_night, texCoord);

    vec2 currLngLat = reverseEquirectangular(gl_FragCoord.xy);
    
    vec3 currPos = vec3(
        cos(currLngLat.y) * cos(currLngLat.x),
        cos(currLngLat.y) * sin(currLngLat.x),
        sin(currLngLat.y)
    );
    
    float angle = acos(clamp(dot(u_sun_dir, currPos), -1.0, 1.0));
    float brightnessFactor = 1.0 - angle/PI;
    float brightnessCoFactor = 1.0;
    
    if (angle > CIVIL_TWILIGHT) brightnessCoFactor -= 0.3;
    if (angle > NAUTICAL_TWILIGHT) brightnessCoFactor -= 0.3;
    if (angle > ASTRONOMICAL_TWILIGHT) brightnessCoFactor -= 0.3;
    if (angle > NIGHT) brightnessCoFactor -= 0.1;
   
    brightnessFactor = brightnessFactor * brightnessFactor * 0.5 + brightnessCoFactor;

    const vec3 oceanColor = vec3(11.0/255.0, 10.0/255.0, 50.0/255.0);
    const vec3 betterOceanColor = vec3(6.0/255.0, 66.0/255.0, 115.0/255.0);

    vec4 finalColor = mapColorDay;

    if (angle >= CIVIL_TWILIGHT) {
        if (angle < NIGHT) {
            if (distance(mapColorDay.xyz, oceanColor) <= 0.2) {
                finalColor = vec4(mix(betterOceanColor, oceanColor,  clamp(angle*0.34, 0.0, 1.0)), 1.0);
            }
        }
        finalColor = vec4(mix(finalColor.xyz, mapColorNight.xyz, 1.0 - brightnessCoFactor), 1.0);
    } else {
        if (distance(finalColor.xyz, oceanColor) <= 0.2) {
            finalColor = vec4(mix(betterOceanColor, oceanColor,  clamp(angle*0.25, 0.0, 1.0)), 1.0);
        }
    }
    
    if (angle >= CIVIL_TWILIGHT - 0.005) finalColor = drawLine(finalColor, angle, CIVIL_TWILIGHT, 0.01);
    if (angle >= NAUTICAL_TWILIGHT - 0.005) finalColor = drawLine(finalColor, angle, NAUTICAL_TWILIGHT, 0.01);
    if (angle >= ASTRONOMICAL_TWILIGHT - 0.005) finalColor = drawLine(finalColor, angle, ASTRONOMICAL_TWILIGHT, 0.01);
    if (angle >= NIGHT - 0.005) finalColor = drawLine(finalColor, angle, NIGHT, 0.01);

    gl_FragColor = finalColor;
}
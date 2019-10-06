# Leaflet-Craft 

Extends https://github.com/Wildhoney/Leaflet.FreeDraw made by WildHoney and adds following functionalities to it:

1. Adds Undo-Redo feature to Polygons.

<img width="291" alt="Screenshot 2019-10-07 at 1 35 47 AM" src="https://user-images.githubusercontent.com/14952645/66275099-ebcdf480-e8a2-11e9-8b19-3b2654e1c1c7.png">

2. Adds Delete 1 marker feature by right clicking it.

3. Adds Delete multiple markers by drawing circle around them :)

<img width="499" alt="Screenshot 2019-10-07 at 1 42 05 AM" src="https://user-images.githubusercontent.com/14952645/66275181-c7264c80-e8a3-11e9-854c-6e7833449fba.png">


4. Adds Control Bar to easily change MODES - Create, Edit, Delete Polygon, Delete 1 Marker, Delete multiple Markers.


<img width="646" alt="Screenshot 2019-10-07 at 1 48 57 AM" src="https://user-images.githubusercontent.com/14952645/66275285-a7dbef00-e8a4-11e9-80ff-5c1dc2193efb.png">


5. Calculates AREA (in metre square) of polygon which changes dynamically on editing the polygon. Stored with key `polygonArea` in each polygon's leaflet object. 

`export const polygonArea = Symbol('freedraw/polygonArea')`
We use TURF Area function to calculate the area.

6. Add Hooks:
We can sunscribe to following Event listeners and can pass a callback function to be executed.

* Polygon created: Started
* Polygon created: Ended
* Polygon edit: Started
* Polygon edit: Ended
* Polygon delete: Started
* Polygon delete: Ended


Work in PROGRESS: 

1. Conversion to Typescript.
2. Adding functionality to create Polygon via clicking (similar to Leaflet.Draw).



## ABOUT: 

Thank you @wildhoney, @ankeetmaini and other contributors :heart: . This library is actively maintained by @sagarpreet-chadha .


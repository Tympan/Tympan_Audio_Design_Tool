
2018-07-02, Chip Audette, Open Audio

>>>>>>>> Overall Goal

The goal of the Matlab scripting stuff is, ultimately, to create a new index.html file that lives in the main directory (ie, one back from "scripts").  

>>>>>>>> Caveat and Embarassment

If you open the index.html file, you'll note that it is HUGE.  It contains not just the HTML that is displayed on the screen, but also all of the information (including help information) for all of the different processing blocks.  In other words, this index.html file is overly large and does too many things.  Perhaps, it should be re-engineered and broken up into pieces.  That is beyond my skill.

Also, these scripts do NOT need to be Matlab scripts.  But, it's the only scripting language that I'm really fluent in.  This could totally be done in other scripting languages.  It could probably even be done better in other scripting languages.

>>>>>>>> Scripting Approach

There are two Matlab scripts:

(1) parseIndexHTML.m:  This script reads the original index.html file from the original "Teensy Audio Design" tool.  The matlab scripts breaks it up into pieces and saves the pieces to temporary files.  These pieces are then reassembled (along with the new content) by the next Matlab script "writeNewIndexHTML.m".

Theoretically, this matlab script only ever needs to be run once because it's reading an old html file that never changes.  The only reason you'd re-run this script is if you editted the script to break-up the file in some new way.


(2) writeNewIndexHTML.m:  This script assembles a new index.html file given the pieces from the old index.html file and through generating the new content for the audio classes in the Tympan_Library.  
There are two types of new content that it generates: it creates a script "node" for every class and  it creates html help docs for every class.  If one is working on debugging/updated the code for the nodes, you can probably ignore or defeat the html help docs and the index.html file should still be functional.



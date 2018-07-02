/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var RED = (function() {

	$('#btn-keyboard-shortcuts').click(function(){showHelp();});

	function hideDropTarget() {
		$("#dropTarget").hide();
		RED.keyboard.remove(/* ESCAPE */ 27);
	}

	$('#chart').on("dragenter",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			$("#dropTarget").css({display:'table'});
			RED.keyboard.add(/* ESCAPE */ 27,hideDropTarget);
		}
	});

	$('#dropTarget').on("dragover",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			event.preventDefault();
		}
	})
	.on("dragleave",function(event) {
		hideDropTarget();
	})
	.on("drop",function(event) {
		var data = event.originalEvent.dataTransfer.getData("text/plain");
		hideDropTarget();
		RED.view.importNodes(data);
		event.preventDefault();
	});
	function make_name(n) {
		var name = (n.name ? n.name : n.id);
		name = name.replace(" ", "_").replace("+", "_").replace("-", "_");
		return name
	}

	function save(force) {
		RED.storage.update();

		if (RED.nodes.hasIO()) {
			var nns = RED.nodes.createCompleteNodeSet();
			// sort by horizontal position, plus slight vertical position,
			// for well defined update order that follows signal flow
			nns.sort(function(a,b){ return (a.x + a.y/250) - (b.x + b.y/250); });
			//console.log(JSON.stringify(nns));

			//start with some header information
			var cpp = "\n";
			cpp += "/*\n";
			cpp += "  This Arduino/Tympan code was auto-generated using the Tympan Audio System Design Tool\n";
			cpp += "  \n";
			cpp += "  The Tympan team hopes that you have fun with your audio hacking!\n";
			cpp += "*/\n";
			cpp += "\n";
			
			//add the include files
			cpp += "//Include files\n";
			cpp += "#include <Tympan_Library.h>\n";
			cpp += "\n";
				
			//add the block that sets the sample rate and block size
			cpp += "//Define the sample rate and block size\n"
			cpp += "const float sample_rate_Hz = 44117.647f ; //16000, 24000 or 44117.647f (or other frequencies in the table in AudioOutputI2S_F32)\n";
			cpp += "const int audio_block_samples = 128;  //smaller blocks (try 16) has less latency but may break SD writing or USB audio.  Do not make bigger than 128\n";
			cpp += "AudioSettings_F32   audio_settings(sample_rate_Hz, audio_block_samples);\n";
			cpp += "\n";
			
			//create the Tympan hardware classes
			cpp += "//Create audio objects\n"
			cpp += "TympanPins\ttympPins(TYMPAN_REV_C);\t//TYMPAN_REV_C or TYMPAN_REV_D\n";
			cpp += "TympanBase\taudioHardware(tympPins);\n";
			
			// generate code for all control nodes (no inputs or outputs)
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				var node = RED.nodes.node(n.id);
				if (node && node.outputs == 0 && node._def.inputs == 0) {
					cpp += n.type + " ";
					for (var j=n.type.length; j<24; j++) cpp += " ";
					cpp += n.id + "; ";
					for (var j=n.id.length; j<14; j++) cpp += " ";
					cpp += "//xy=" + n.x + "," + n.y + "\n";
				}
			}						
				
			// generate code for all audio processing nodes
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				var node = RED.nodes.node(n.id);
				if (node && (node.outputs > 0 || node._def.inputs > 0)) {
					cpp += n.type + " ";
					for (var j=n.type.length; j<24; j++) cpp += " ";
					var name = make_name(n)
					cpp += name + "(audio_settings);";
					for (var j=n.id.length; j<14; j++) cpp += " ";
					//cpp += "//xy=" + n.x + "," + n.y
					cpp += "\n";
				}
			}
			cpp += "\n";
			
			// generate code for all connections (aka wires or links)
			cpp += "//Create audio connections\n"
			var cordcount = 1;
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				if (n.wires) {
					for (var j=0; j<n.wires.length; j++) {
						var wires = n.wires[j];
						if (!wires) continue;
						for (var k=0; k<wires.length; k++) {
							var wire = n.wires[j][k];
							if (wire) {
								var parts = wire.split(":");
								if (parts.length == 2) {
									cpp += "AudioConnection_F32         patchCord" + cordcount + "(";
									var src = RED.nodes.node(n.id);
									var dst = RED.nodes.node(parts[0]);
									var src_name = make_name(src);
									var dst_name = make_name(dst);
									//if (j == 0 && parts[1] == 0 && src && src.outputs == 1 && dst && dst._def.inputs == 1) {
									//	cpp += src_name + ", " + parts[0];
									//} else {
										cpp += src_name + ", " + j + ", " + dst_name + ", " + parts[1];
									//}
									cpp += ");\n";
									cordcount++;
								}
							}
						}
					}
				}
			}
			cpp += "\n";
						


			
			// generate setup()
			cpp += "//The setup function is called once when the system starts up\n";
			cpp += "float32_t input_gain_dB = 15.0;  //this is a good starting point\n";
			cpp += "float32_t vol_knob_gain_dB = 0.0; //this is a good starting point\n";
			cpp += "void setup(void) {\n";
			cpp += "\t" + "//Start the USB serial link (to enable debugging)\n";
			cpp += "\t" + "Serial.begin(115200); delay(500);\n";
			cpp += "\t" + "Serial.println(\"Setup starting...\");\n";
			cpp += "\t" + "\n"
			cpp += "\t" + "//Allocate dynamically shuffled memory for the audio subsystem\n";
			//cpp += "\t" + "AudioMemory(10);\n";
			cpp += "\t" + "AudioMemory_F32_wSettings(20,audio_settings);  //allocate Float32 audio data blocks (primary memory used for audio processing)\n";
			cpp += "\t\n";
			cpp += "\t//Enable the Tympan to start the audio flowing!\n";
			cpp += "\t" + "audioHardware.enable(); // activate AIC\n";
			cpp += "\t" + "\n";
			cpp += "\t" + "//Choose the desired input\n";
			cpp += "\t" + "audioHardware.inputSelect(TYMPAN_INPUT_ON_BOARD_MIC);     // use the on board microphones\n";
			cpp += "\t" + "//audioHardware.inputSelect(TYMPAN_INPUT_JACK_AS_MIC);    // use the microphone jack - defaults to mic bias 2.5V\n";
			cpp += "\t" + "//audioHardware.inputSelect(TYMPAN_INPUT_JACK_AS_LINEIN); // use the microphone jack - defaults to mic bias OFF\n";
			cpp += "\t" + "\n";
			cpp += "\t" + "//Set the desired volume levels\n";
			cpp += "\t" + "audioHardware.volume_dB(vol_knob_gain_dB);    // headphone amplifier.  -63.6 to +24 dB in 0.5dB steps.\n";
			cpp += "\t" + "audioHardware.setInputGain_dB(input_gain_dB); // set input volume, 0-47.5dB in 0.5dB setps\n";
			cpp += "\t" + "\n";
			cpp += "\t" + "//service the potentiometer to get its current setting\t\n";
			cpp += "\t" + "servicePotentiometer(millis(),0);\n";
			cpp += "\t" + "\n";
			cpp += "\t" + "//Put your own setup code here\n";
			cpp += "\t" + "\n";
			cpp += "\t" + "//End of setup\n";
			cpp += "\t" + "Serial.println(\"Setup complete.\");\n";
			cpp += "};\n";
			
			 // generate loop()
			cpp += "\n";
			cpp += "\n";
			cpp += "//After setup(), the loop function loops forever.\n";
			cpp += "//Note that the audio modules are called in the background.\n";
			cpp += "//They do not need to be serviced by the loop() function.\n"
			cpp += "void loop(void) {\n";
			cpp += "\t\n";
			cpp += "\t" + "//periodically check the potentiometer\n";
			cpp += "\t" + "servicePotentiometer(millis(),100); //update every 100 msec\n";
			cpp += "\t\n";
			cpp += "\t//check to see whether to print the CPU and Memory Usage\n";
			cpp += "\tprintCPUandMemory(millis(),3000); //print every 3000 msec\n";
			cpp += "\n";
			cpp += "};\n";
			
			// add some servicing routines
			cpp += "\n\n";			
			cpp += "// ///////////////// Servicing routines\n";
			cpp += "\n";
			cpp += "//servicePotentiometer: listens to the blue potentiometer and sends the new pot value\n";
			cpp += "//  to the audio processing algorithm as a control parameter\n";
			cpp += "void servicePotentiometer(unsigned long curTime_millis, unsigned long updatePeriod_millis) {\n";
			cpp +=   "\tstatic unsigned long lastUpdate_millis = 0;\n";
			cpp +=   "\tstatic float prev_val = -1.0;\n";
			cpp +=   "\t\n";
			cpp +=   "\t//has enough time passed to update everything?\n";
			cpp +=   "\tif (curTime_millis < lastUpdate_millis) lastUpdate_millis = 0; //handle wrap-around of the clock\n";
			cpp +=   "\tif ((curTime_millis - lastUpdate_millis) > updatePeriod_millis) { //is it time to update the user interface?\n";
			cpp +=     "\t\t\n";
			cpp +=     "\t\t//read potentiometer (and quantize to reduce effects of noise)\n";
			cpp +=     "\t\tfloat val = float(audioHardware.readPotentiometer()) / 1023.0; //0.0 to 1.0\n";
			cpp +=     "\t\tval = (1.0/9.0) * (float)((int)(9.0 * val + 0.5)); //quantize so that it doesn't chatter...0 to 1.0\n";
			cpp +=     "\t\t\n";
			cpp +=     "\t\t//send the potentiometer value to your algorithm as a control parameter\n";
			cpp +=     "\t\tif (abs(val - prev_val) > 0.05) { //is it different than before?\n";
			cpp +=       "\t\t\tprev_val = val;  //save the value for comparison for the next time around\n";
			cpp +=       "\t\t\t\n";
			cpp +=       "\t\t\t//choose the desired gain value based on the knob setting\n";
			cpp +=       "\t\t\tconst float min_gain_dB = -40.0, max_gain_dB = 20.0; //set desired gain range\n";
			cpp +=       "\t\t\tvol_knob_gain_dB = min_gain_dB + (max_gain_dB - min_gain_dB)*val; //computed desired gain value in dB\n";
			cpp +=       "\t\t\taudioHardware.volume_dB(vol_knob_gain_dB); //command the new volume setting\n";
			cpp +=       "\t\t\tSerial.print(\"servicePotentiometer: new volume dB = \"); Serial.println(vol_knob_gain_dB); //print text to Serial port for debugging\n";
			cpp +=       "\t\t\t\n";
			cpp +=       "\t\t\t//Or, a better way to change volume is to change your algorithm gain, if you have such a block\n"
			cpp +=       "\t\t\t//const float min_gain_dB = -20.0, max_gain_dB = 40.0; //set desired gain range\n";
			cpp +=       "\t\t\t//vol_knob_gain_dB = min_gain_dB + (max_gain_dB - min_gain_dB)*val; //computed desired gain value in dB\n";
			cpp +=       "\t\t\t//gain1.setGain_dB(vol_knob_gain_dB); //command the new gain setting\n";
			cpp +=       "\t\t\t//Serial.print(\"servicePotentiometer: new volume dB = \"); Serial.println(vol_knob_gain_dB); //print text to Serial port for debugging\n";			
			cpp +=     "\t\t}\n";
			cpp +=     "\t\tlastUpdate_millis = curTime_millis;\n";
			cpp +=   "\t}; // end if\n";
			cpp += "} //end servicePotentiometer();\n";
			cpp += "\n";


			
			
			cpp += "//This routine prints the current and maximum CPU usage and the current usage of the AudioMemory that has been allocated\n";
			cpp += "void printCPUandMemory(unsigned long curTime_millis, unsigned long updatePeriod_millis) {\n";
			cpp += "\tstatic unsigned long lastUpdate_millis = 0;\n";
			cpp += "\t//has enough time passed to update everything?\n";
			cpp += "\tif (curTime_millis < lastUpdate_millis) lastUpdate_millis = 0; //handle wrap-around of the clock\n";
			cpp += "\tif ((curTime_millis - lastUpdate_millis) > updatePeriod_millis) { //is it time to update the user interface?\n";
			cpp += "\t\tSerial.print(\"printCPUandMemory: \");\n";
			cpp += "\t\tSerial.print(\"CPU Cur/Peak: \");\n";
			cpp += "\t\tSerial.print(audio_settings.processorUsage());\n";
			cpp += "\t\tSerial.print(\"%/\");\n";
			cpp += "\t\tSerial.print(audio_settings.processorUsageMax());\n";
			cpp += "\t\tSerial.print(\"%,   \");\n";
			cpp += "\t\tSerial.print(\"Dyn MEM Float32 Cur/Peak: \");\n";
			cpp += "\t\tSerial.print(AudioMemoryUsage_F32());\n";
			cpp += "\t\tSerial.print(\"/\");\n";
			cpp += "\t\tSerial.print(AudioMemoryUsageMax_F32());\n";
			cpp += "\t\tSerial.println();\n";
			cpp += "\t\t\n";
			cpp += "\t\tlastUpdate_millis = curTime_millis; //we will use this value the next time around.\n";
			cpp += "\t};\n";
			cpp +="};";
			
			cpp += "\n";

			//console.log(cpp);
			
			RED.view.state(RED.state.EXPORT);
			RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
				$("#node-input-export").val(cpp).focus(function() {
				var textarea = $(this);
				textarea.select();
				textarea.mouseup(function() {
					textarea.unbind("mouseup");
					return false;
				});
				}).focus();
			$( "#dialog" ).dialog("option","title","Export to Arduino").dialog("option","width",600).dialog( "open" );
			});
			//RED.view.dirty(false);
		} else {
			$( "#node-dialog-error-deploy" ).dialog({
				title: "Error exporting data to Arduino IDE",
				modal: true,
				autoOpen: false,
				width: 410,
				height: 245,
				buttons: [{
					text: "Ok",
					click: function() {
						$( this ).dialog( "close" );
					}
				}]
			}).dialog("open");
		}
	}

	$('#btn-deploy').click(function() { save(); });


	$( "#node-dialog-confirm-deploy" ).dialog({
			title: "Confirm deploy",
			modal: true,
			autoOpen: false,
			width: 530,
			height: 230,
			buttons: [
				{
					text: "Confirm deploy",
					click: function() {
						save(true);
						$( this ).dialog( "close" );
					}
				},
				{
					text: "Cancel",
					click: function() {
						$( this ).dialog( "close" );
					}
				}
			]
	});

	// from http://css-tricks.com/snippets/javascript/get-url-variables/
	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if(pair[0] == variable){return pair[1];}
		}
		return(false);
	}

	function loadNodes() {
			$(".palette-scroll").show();
			$("#palette-search").show();
			RED.storage.load();
			RED.view.redraw();
			setTimeout(function() {
				$("#btn-deploy").removeClass("disabled").addClass("btn-danger");
				$("#btn-import").removeClass("disabled").addClass("btn-success");
			}, 1500);
			$('#btn-deploy').click(function() { save(); });
			// if the query string has ?info=className, populate info tab
			var info = getQueryVariable("info");
			if (info) {
				RED.sidebar.info.setHelpContent('', info);
			}
	}

	$('#btn-node-status').click(function() {toggleStatus();});

	var statusEnabled = false;
	function toggleStatus() {
		var btnStatus = $("#btn-node-status");
		statusEnabled = btnStatus.toggleClass("active").hasClass("active");
		RED.view.status(statusEnabled);
	}
	
	function showHelp() {

		var dialog = $('#node-help');

		//$("#node-help").draggable({
		//        handle: ".modal-header"
		//});

		dialog.on('show',function() {
			RED.keyboard.disable();
		});
		dialog.on('hidden',function() {
			RED.keyboard.enable();
		});

		dialog.modal();
	}

	$(function() {
		$(".palette-spinner").show();

		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);

		if (!server) {
			var data = $.parseJSON($("script[data-container-name|='NodeDefinitions']").html());
			var nodes = data["nodes"];
			$.each(nodes, function (key, val) {
				RED.nodes.registerType(val["type"], val["data"]);
			});
			RED.keyboard.add(/* ? */ 191, {shift: true}, function () {
				showHelp();
				d3.event.preventDefault();
			});
			loadNodes();
			$(".palette-spinner").hide();
		} else {
			$.ajaxSetup({beforeSend: function(xhr){
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
			}});
			$.getJSON( "resources/nodes_def.json", function( data ) {
				var nodes = data["nodes"];
				$.each(nodes, function(key, val) {
					RED.nodes.registerType(val["type"], val["data"]);
				});
				RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
				loadNodes();
				$(".palette-spinner").hide();
			})
		}
	});

	return {
	};
})();

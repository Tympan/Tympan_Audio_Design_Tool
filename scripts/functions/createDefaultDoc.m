function all_lines = createEmptyDoc(name,class_comment_lines)

name = deblank(name);

all_lines={};
if ~isempty(class_comment_lines)
    all_lines = addHelpText(name,class_comment_lines,all_lines);
end
all_lines = addTemplateText(name,all_lines);

return

%% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%
function all_lines = addHelpText(name,my_text,all_lines)
    if iscell(my_text)
        my_text = strvcat(my_text);
    end
    
    
    all_lines{end+1} = ['<script type="text/x-red" data-help-name="' name '">'];
    if (1)
        %use html paragraph format for each line
        for Iline=1:size(my_text,1)
            all_lines{end+1} = ['<p>' deblank(my_text(Iline,:)) '</p>'];
        end
    else
        %use html code dag
        %all_lines{end+1} = '<code>';
        for Iline=1:size(my_text,1)
            all_lines{end+1} = ['<code>' deblank(my_text(Iline,:)) '</code>'];
        end
        %all_lines{end+1} = '</code>';
    end
    
	
%     <h3>Summary</h3>
% 	<div class=tooltipinfo>
% 	<p>Finite impulse response filter, useful for all sorts of filtering.
% 	</p>
% 	<p align=center><img src="img/fir_filter.png"></p>
% 	</div>
% 	<h3>Audio Connections</h3>
% 	<table class=doc align=center cellpadding=3>
% 		<tr class=top><th>Port</th><th>Purpose</th></tr>
% 		<tr class=odd><td align=center>In 0</td><td>Signal to be filtered</td></tr>
% 		<tr class=odd><td align=center>Out 0</td><td>Filtered Signal Output</td></tr>
% 	</table>
% 	<h3>Functions</h3>
% 	<p class=func><span class=keyword>begin</span>(filter_coeff, filter_length, block_size);</p>
% 	<p class=desc>Initialize the filter.  The filter_coeff must be an array of 32-bit floats (the
% 		filter's impulse response), the filter_length indicates the number of points in the array,
% 		and block_size is the length of the audio block that will be passed to this filtering
% 		object during operation.  The filter_coeff array may also be set as
% 		FIR_PASSTHRU (with filter_length = 0), to directly pass the input to output without
% 		filtering.
% 	</p>
% 	<p class=func><span class=keyword>end</span>();</p>
% 	<p class=desc>Turn the filter off.
% 	</p>
% 	<!--
% 	<h3>Examples</h3>
% 	<p class=exam>File &gt; Examples &gt; Audio &gt; Effects &gt; Filter_FIR
% 	</p>
% 	-->
% 	<h3>Known Issues</h3>
% 	<p>Your filter's impulse response array must have an even length.  If you have
% 		add odd number of taps, you must add an extra zero to increase the length
% 		to an even number.
% 	</p>
% 	<p>The minimum number of taps is 4.  If you use less, add extra zeros to increase
% 		the length to 4.
% 	</p>
% 	<p>The impulse response must be given in reverse order.  Many filters have
% 		symetrical impluse response, making this a non-issue.  If your filter has
% 		a non-symetrical response, make sure the data is in reverse time order.
% 	</p>
% 	<h3>Notes</h3>
% 	<p>FIR filters requires more CPU time than Biquad (IIR), but they can
% 		implement filters with better phase response.
% 	</p>
% 	<p>The free
% 		<a href="http://t-filter.engineerjs.com/" target="_blank"> TFilter Design Tool</a>
% 		can be used to create the impulse response array.  Be sure to choose the desired sampling
% 		frequency (the tool defaults to only 2000 Hz whereas Tympan defaults to 44117) and
% 		the output type to "float" (32 bit).
% 	</p>
    all_lines{end+1} = '</script>';
return

%% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
function all_lines = addTemplateText(name,all_lines)

all_lines{end+1} = ['<script type="text/x-red" data-template-name="' name ' ">'];
all_lines{end+1} = [sprintf('\t') '<div class="form-row">'];
all_lines{end+1} = [sprintf('\t\t') '<label for="node-input-name"><i class="fa fa-tag"></i> Name</label>'];
all_lines{end+1} = [sprintf('\t\t') '<input type="text" id="node-input-name" placeholder="Name">'];
all_lines{end+1} = [sprintf('\t') '</div>'];
all_lines{end+1} = '</script>';

return


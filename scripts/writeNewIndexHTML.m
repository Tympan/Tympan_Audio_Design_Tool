
addpath('functions\');

overall_outfname = '..\index.html';
inpname = 'ParsedInputs\';  %previous content saved by parseIndexHTML.m

all_lines={};

% copy header information from original index.html
infname = [inpname 'header.txt'];   %previous content saved by parseIndexHTML.m
disp(['Copying lines from ' infname]);
foo_lines = readAllLines(infname);
all_lines(end+[1:length(foo_lines)]) = foo_lines;

% copy transition to nodes from original index.html
infname = [inpname 'transition_to_nodes.txt'];   %previous content saved by parseIndexHTML.m
disp(['Copying lines from ' infname]);
foo_lines = readAllLines(infname);  %read the text in
all_lines(end+[1:length(foo_lines)]) = foo_lines; %accumulate the lines

% create new nodes...this is the real core of this script. 
origNode_fname = 'ParsedInputs\nodes.txt';   %previous content saved by parseIndexHTML.m
newNode_pname = 'C:\Users\wea\Documents\Arduino\libraries\Tympan_Library\src\';  %%%%% point this to your Tympan_Library!!!!
[nodes,ignore_node_heading] = generateNodes(origNode_fname,newNode_pname);   %This function is beastly!  And probably fragile!
outfname = 'NewOutputs\new_nodes.txt';
writeNodeText(nodes,outfname,ignore_node_heading);  %write to text file
infname = outfname;
foo_lines = readAllLines(infname); %load the text back in
all_lines(end+[1:length(foo_lines)]) = foo_lines; %accumulate the lines

% copy the transition to docs
infname = [inpname 'transitionToDocs.txt'];   %previous content saved by parseIndexHTML.m
disp(['Copying lines from ' infname]);
foo_lines = readAllLines(infname);  %read the text in
all_lines(end+[1:length(foo_lines)]) = foo_lines; %accumulate the lines

% assemble the help docs for each audio module to be displayed to the user from within the webpage
for Inode = 1:length(nodes)
    dir_f32 = '..\audio_f32_html\';
    dir_orig = '..\audio_html\';
    %nodes(Inode).type
    foo_lines = findAndLoadMatchingDoc(nodes(Inode).type,dir_f32,dir_orig);  %this is probably fragile, too!
    
    if isempty(foo_lines)
        %foo_lines = createEmptyDoc(nodes(Inode).type);
        foo_lines = createDefaultDoc(nodes(Inode).type,nodes(Inode).comment_lines);
    end
    all_lines(end+[1:length(foo_lines)]) = foo_lines;
end

% copy the end of the file
infname = [inpname 'end_of_file.txt'];   %previous content saved by parseIndexHTML.m
disp(['Copying lines from ' infname]);
foo_lines = readAllLines(infname);  %read the text in
all_lines(end+[1:length(foo_lines)]) = foo_lines; %accumulate the lines


% write the text to the file
disp(['writing main output to ' overall_outfname]);
writeText(overall_outfname,all_lines);




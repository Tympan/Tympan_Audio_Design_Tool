function writeNodeText(nodes,outfname,ignore_node_heading)

fn = fieldnames(nodes(1));

%outfname = 'NewOutputs\new_nodes.txt';
disp(['writing new node info to ' outfname]);

fid=fopen(outfname,'w');
for Inode=1:length(nodes)
    fprintf(fid,'		{');
    count=0;
    for Ifn=1:length(fn)
        field_name = fn{Ifn};
        %if size(field_val,1) == 1  %as a result, this should skip over comment_lines
        if ~strcmpi(field_name,ignore_node_heading)  %skip over comment lines
            count = count+1;
            if count > 1
                fprintf(fid,',');
            end
            fprintf(fid,'"%s":',field_name);
            
            
            field_val = nodes(Inode).(field_name);
            if field_val(1) == '"'; field_val = field_val(2:end); end;
            if field_val(end) == '"'; field_val = field_val(1:end-1);end;
            if strcmpi(field_name,'data')
                fprintf(fid,'%s',field_val);
            elseif isnumeric(field_val)
                fprintf(fid,'"%i"',field_val);
            else
                fprintf(fid,'"%s"',field_val);
            end
            
        end
    end
    
    %finish off this entry
    if (length(field_val) > 1) && (field_val(end-1:end) == '}}');
        %do nothing;
    else
        %insert these symbols
        fprintf(fid,'}}');
    end

   
    if Inode < length(nodes)
        fprintf(fid,',\n');
    else
        fprintf(fid,'\n');
    end
end
fclose(fid);

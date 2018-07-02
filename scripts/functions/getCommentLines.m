function comment_lines = getCommentLines(all_lines,Iline)

%let's just grab the file header comment.  That's simplest, though maybe wrong
comment_lines = grabFileHeaderComment(all_lines);

return

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
function comment_lines = grabFileHeaderComment(all_lines)

%default to grabbing all the first lines that are comments
Ikeep = [];
Iline = 0;
done = 0;

NOT_STARTED = 0;
STARTED_LINE_BY_LINE = 1;
STARTED_BLOCK = 2;
DONE = 3;
state = NOT_STARTED;
comment_lines = {};
while state ~= DONE
    Iline=Iline+1;
    if Iline > length(all_lines)
        state = DONE;
    else
        foo = deblank(all_lines{Iline});
        switch state
            case NOT_STARTED
                if length(foo) >= 2
                    if strcmpi(foo(1:2),'//')
                        state = STARTED_LINE_BY_LINE;
                        comment_lines{end+1} = foo(3:end);
                    elseif strcmpi(foo(1:2),'/*')
                        state = STARTED_BLOCK;
                        comment_lines{end+1} = foo(3:end);
                    end
                end
            case STARTED_LINE_BY_LINE
                if length(foo) < 2
                    state = DONE;
                elseif strcmpi(foo(1:2),'//')
                    comment_lines{end+1} = foo(3:end);
                else
                    state = DONE;
                end
            case STARTED_BLOCK
                if length(foo) == 0
                    comment_lines{end+1} = '';
                elseif length(foo) == 1
                    if foo == '*'
                        comment_lines{end+1} = '';
                    else
                        comment_lines{end+1} = foo;
                    end
                elseif strcmpi(foo(1:2),'*/')
                    state = DONE;
                elseif strcmpi(foo(1:2),' *')
                    if length(foo) >= 3
                        if strcmpi(foo(2:3),'*/')
                            state = DONE;
                        else
                            comment_lines{end+1} = foo(3:end);
                        end
                    else
                        comment_lines{end+1} = foo(3:end);
                    end
                elseif strcmpi(foo(1),'*')
                    comment_lines{end+1} = foo(2:end);
                else
                    comment_lines{end+1} = foo;
                end
        end
    end
end


return

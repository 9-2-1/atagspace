call conda activate atagspace
call python app.py extension tagspaces_export -s
call python app.py extension tagspaces_export_library "tags library [atagspace].json"
if not "%~1" == "nopause" pause

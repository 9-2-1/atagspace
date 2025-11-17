call conda activate atagspace
call python app.py tagfile updatesrc sources.txt
call python app.py tagfile updatenew
if not "%~1" == "nopause" pause

call conda activate atagspace
python app.py tagfile updatenew
python app.py extension totag -s
python app.py extension sorttag
if not "%~1" == "nopause" pause

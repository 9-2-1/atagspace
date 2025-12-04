call conda activate atagspace
python app.py tagfile updatenew
python app.py extension totag
python app.py extension sorttag
python app.py extension tagspaces_export -s
python app.py extension automove -m moverule.txt
python app.py extension unempty
python app.py tagfile updatenew -f
if not "%~1" == "nopause" pause

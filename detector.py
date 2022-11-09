#FOR DETECTION OF KDASH -> 
# python detector.py kdash
# python detector.py tripper

# Records will be pulled one by one and detected and stored in the DB
import mysql.connector
import torch
import base64   
import json
import pandas as pd
from PIL import Image
import sys


possible_args = {
    'kdash': 'kdash',
    'tripper':'tripper'
}

current_detection_mode = possible_args['tripper']

if(len(sys.argv) > 1 and sys.argv[1] == possible_args['kdash']):
    current_detection_mode = possible_args['kdash']

print('## DETECTION INITIATED . MODE = ',current_detection_mode)


isKdash = current_detection_mode == possible_args['kdash']
# prefix = "data:image/png;base64,"
# b64 =  ""


model = None

if(isKdash):
    model = torch.hub.load('yolov5', 'custom', path='yolov5/best.pt', source='local')#kdashmodel
else:
    model = torch.hub.load('yolov5', 'custom', path='yolov5/best_tripper.pt', source='local')#local repo

# decoded_data=base64.b64decode((im))
# res = model(decoded_data)
# encodd = b64.encode('ascii')
# base64_b = base64.b64decode(encodd)

# img_file = open('/Users/Connected/Desktop/image.jpeg', 'wb')
# img_file.write(decoded_data)
# img_file.close()
# # a=res.pandas().xyxy[0].to_json(orient ="records")
# print(res)

# def store(result):
#     print("TO BE IMPLEMENTED")
#     return result

#Tripper Parsing logic 
def results_parser_tripper(results):# fucntion for parsing the model obj to string 
    text = ['text_1','text_2']
    tripper = ['Tripper_pod']

    symbols = list(filter(lambda n: n['name'] not in tripper and n['name'] not in text, results))
    texts = list(filter(lambda n:  n['name'] in text, results))
    trippers = list(filter(lambda n:  n['name'] in tripper, results))
    
    symbols.sort(key = lambda x: x['confidence'])
    texts.sort(key = lambda x: x['confidence'])
    trippers.sort(key = lambda x: x['confidence'])

    symbols = symbols[0:2]
    texts = texts[0:2]
    tripper = trippers[0]['name']

    symbols.sort(key = lambda x: x['xmin'])
    texts.sort(key = lambda x: x['ymin'])
    
    primary_image = symbols[0]['name'] if len(symbols) >= 1 else ''
    Secondary_image = symbols[1]['name'] if len(symbols) >= 2 else ''
    text_1 =  texts[0]['name'] if len(texts) >= 1 else ''
    text_2 = texts[1]['name'] if len(texts) >= 2 else ''

    return {
        'primary_image':primary_image,
       'Secondary_image': Secondary_image,
      'text_1': text_1,
     'text_2': text_2,
    'tripper': tripper
      }
    # print('Primary ',primary_image['name'])
    # print('Secondary ',Secondary_image['name'])
    # print('Text1 ',text_1['name'])
    # print('Text2 ',text_2['name'])
    # print('Tripper ',tripper['name'])


def results_parser(results):# fucntion for parsing the model obj to string 
    text = ['text_1']
    
    tripper = ['Tripper_pod']

    symbols = list(filter(lambda n: n['name'] not in tripper and n['name'] not in text, results))
    texts = list(filter(lambda n:  n['name'] in text, results))
    # trippers = list(filter(lambda n:  n['name'] in tripper, results))
    
    symbols.sort(key = lambda x: x['confidence'])
    texts.sort(key = lambda x: x['confidence'])
    # trippers.sort(key = lambda x: x['confidence'])

    symbols = symbols[0:2]
    texts = texts[0:2]
    # tripper = lentrippers[0]

    symbols.sort(key = lambda x: x['xmin'])
    texts.sort(key = lambda x: x['ymin'])


    primary_image = symbols[0]['name'] if len(symbols) >= 1 else ''
    Secondary_image = symbols[1]['name'] if len(symbols) >= 2 else ''
    text_1 =  texts[0]['name'] if len(texts) >= 1 else ''
    
    
   

    return {
        'primary_image':primary_image,
       'Secondary_image': Secondary_image,
       'text_1': text_1,
    #  'text_2': text_2,
    #  'tripper': tripper
      }
    # print('Primary ',primary_image['name'])
    # print('Secondary ',Secondary_image['name'])
    # print('Text1 ',text_1['name'])
    # print('Text2 ',text_2['name'])
    # print('Tripper ',tripper['name'])


def predict(image,fname):# main function for the predict 
    print('na',fname)
    path = 'test/' + fname
    torch.hub.download_url_to_file(image,path)
    im1 = Image.open(path)

    results = model(im1,size=640)
    im1.close()
    json_result = json.loads(results.pandas().xyxy[0].to_json(orient="records") )
    # primary_Image = results
    
    # text_imae = results
    # primary_imae = results
    # primary_imae = results

    return json_result


def fetch_all():

    try:
        connection = mysql.connector.connect(host='localhost',
                                            database='test',
                                            user='root',
                                            password='12345678')

        sql_select_Query = "select * from kdash_raw where is_decoded = false"
        cursor = connection.cursor()
        cursor.execute(sql_select_Query)
        # get all records
        records = cursor.fetchall()
        print("Total number of rows in table: ", cursor.rowcount)

        #for loop for the records 
        for item in records:
            id,Time_stamp,Primary_image,Secondary_image,text_1,image,trip_id,is_decoded= item
            # item[0] = id 
            # item[1] = Time_stamp
            # item[2] = Primary_image
            # item[3] = Secondary_image
            # item[4] = text_1
            # item[5] = text_2
            # item[6] = image
            # item[7] = trip_id
            # item[8] = is_decoded

            
            print("id",item[0])
            print("Time_stamp",item[1])
            print("Trip_id",item[7])
            
            name = str(id) + '.png'
            result = predict(image,name)
           
          

            print('## ',result)

            str_res = {}
            if(isKdash):
                str_res=results_parser(result)
                sql_push = "UPDATE  kdash_raw SET Primary_image = %s, Secondary_image = %s, text_1 = %s, is_decoded = %s where id = " + str(id)
                val = (
                    str_res['primary_image'],
                    str_res['Secondary_image'],
                    str_res['text_1'],
                    True,
                )
            else:
                str_res = results_parser_tripper(result)#tripper response
                sql_push = "UPDATE  tripper_raw SET Primary_image = %s, Secondary_image = %s, text_1 = %s,text_2 = %s, is_decoded = %s where id = " + str(id)
                val = (
                    str_res['primary_image'],
                    str_res['Secondary_image'],
                    str_res['text_1'],
                    str_res['text_2'],
                    True,
                )
           
            cursor.execute(sql_push,val)
           

            
            # str_res=str_res.split(',')
            # print(str_res)
            # print(str_res[0:1],str_res[0:2],str_res[0:3],str_res[0:4],str_res[0:5],str_res[0:6])
            # print((results_parser(result)))
            # ele=result.split(' ')
            # print(ele)
            # print("#### ## ",name,result)
            # sql_insert = "INSERT INTO kdash_raw()"
            # store(result)
            


    except mysql.connector.Error as e:
        print("Error reading data from MySQL table", e)
    finally:
        if connection.is_connected():
            connection.commit()
            connection.close()
            cursor.close()
            print("MySQL connection is closed")


fetch_all()






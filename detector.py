# Records will be pulled one by one and detected and stored in the DB
import mysql.connector
# from datetime import datetime
# from IPython.core.display import Video
import torch
import base64   
# import cv2
# import numpy as np
# import torchvision.models as models
# import torchvision.transforms as transforms
# from io import BytesIO
import json
import pandas as pd
from PIL import Image
# prefix = "data:image/png;base64,"
# b64 =  ""




model = torch.hub.load('yolov5', 'custom', path='yolov5/best.pt', source='local')#local repo
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
    
    primary_image,Secondary_image = symbols
    text_1 = texts[0]

    return {
        'primary_image':primary_image['name'],
       'Secondary_image': Secondary_image['name'],
      'text_1': text_1['name'],
    #  'text_2': text_2['name'],
    #  'tripper': tripper['name']
      }
    # print('Primary ',primary_image['name'])
    # print('Secondary ',Secondary_image['name'])
    # print('Text1 ',text_1['name'])
    # print('Text2 ',text_2['name'])
    # print('Tripper ',tripper['name'])


def predict(image,fname):
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
            
            # id,time,image,trip_id,is_decoded = item
            
            print("id",item[0])
            print("Time_stamp",item[1])
            print("Trip_id",item[7])
            
            name = str(id) + '.png'
            result = predict(image,name)
           
          

            print('## ',result)
            str_res=results_parser(result)
            # print(str_res)
            # print(str_res['primary_image'])
            # str_res['Secondary_image']
            # str_res['text_1']
            # str_res['text_2']
            # str_res['tripper']
            sql_push = "UPDATE  kdash_raw SET Primary_image = %s, Secondary_image = %s, text_1 = %s, is_decoded = %s where id = " + str(id)
            val = (
                str_res['primary_image'],
                str_res['Secondary_image'],
                str_res['text_1'],
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






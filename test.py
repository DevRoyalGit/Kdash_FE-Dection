import pytesseract
import cv2
import matplotlib.pyplot as plt
from PIL import Image
import torch


im = "2.jpg"
model = torch.hub.load('yolov5', 'custom', path='yolov5/best.pt', source='local')

results = model(im)  # inference
crops = results.crop(save=True)
path ='runs/detect/exp/crops/text_1/' + im

print(crops)
# print(pytesseract.image_to_string(Image.open('runs/detect/exp2/crops/text_1/2.jpg')))

# image = cv2.imread("runs/detect/exp2/crops/text_1/2.jpg")
# print("f")
# string = pytesseract.image_to_string(image)
# print(string)
# # or you can use Pillow
# # image = Image.open("test.png")

